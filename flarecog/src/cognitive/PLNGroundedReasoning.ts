/**
 * PLNGroundedReasoning.ts
 * 
 * Validates LLM reasoning outputs against the AtomSpace knowledge base
 * using PLN inference rules. This bridges the gap between neural (LLM)
 * and symbolic (PLN) reasoning by:
 * 
 * 1. Extracting claims from LLM outputs
 * 2. Grounding claims against existing AtomSpace atoms
 * 3. Computing PLN truth values for each claim
 * 4. Producing a confidence-weighted final result
 * 
 * This implements Priority 3 from the FlareCog roadmap:
 * "Enhance AI Orchestrator with PLN-based validation of LLM outputs"
 */

import { PLNReasoning, PLNInferenceResult } from './PLNReasoning';

/**
 * A claim extracted from LLM output
 */
export interface ExtractedClaim {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  claimType: 'inheritance' | 'similarity' | 'evaluation' | 'implication';
  rawText: string;
  position: number; // Position in the original output
}

/**
 * Grounding result for a single claim
 */
export interface GroundingResult {
  claim: ExtractedClaim;
  grounded: boolean;
  supportingAtoms: string[];
  plnTruthValue: { strength: number; confidence: number };
  groundingMethod: 'direct_match' | 'pln_deduction' | 'pln_induction' | 'embedding_similarity' | 'ungrounded';
  explanation: string;
}

/**
 * Full validation result for an LLM output
 */
export interface PLNValidationResult {
  originalOutput: string;
  claims: ExtractedClaim[];
  groundingResults: GroundingResult[];
  overallConfidence: number;
  overallStrength: number;
  validatedOutput: string;
  warnings: string[];
  ungroundedClaims: ExtractedClaim[];
  timestamp: number;
}

/**
 * AtomSpace query interface (abstraction over DO fetch)
 */
interface AtomSpaceQuery {
  findNodeByName(name: string): Promise<AtomRecord | null>;
  findLinksByOutgoing(atomIds: string[]): Promise<AtomRecord[]>;
  findRelated(atomId: string, linkType: string): Promise<AtomRecord[]>;
  semanticSearch(query: string, topK: number): Promise<AtomRecord[]>;
}

interface AtomRecord {
  id: string;
  type: string;
  name: string;
  outgoing?: string[];
  truthValue: { strength: number; confidence: number };
  attentionValue: { sti: number; lti: number; vlti: number };
}

/**
 * Workers AI binding interface
 */
interface AIBinding {
  run(model: string, input: unknown): Promise<unknown>;
}

/**
 * PLN Grounded Reasoning Engine
 * 
 * Validates LLM outputs by grounding claims in the AtomSpace and
 * computing PLN truth values for each assertion.
 */
export class PLNGroundedReasoning {
  private atomSpace: AtomSpaceQuery;
  private ai: AIBinding;
  private claimExtractionModel: string;

  constructor(
    atomSpace: AtomSpaceQuery,
    ai: AIBinding,
    claimExtractionModel: string = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
  ) {
    this.atomSpace = atomSpace;
    this.ai = ai;
    this.claimExtractionModel = claimExtractionModel;
  }

  /**
   * Validate an LLM output by grounding its claims in the AtomSpace
   */
  async validateOutput(llmOutput: string): Promise<PLNValidationResult> {
    const timestamp = Date.now();
    const warnings: string[] = [];

    // Step 1: Extract claims from the LLM output
    const claims = await this.extractClaims(llmOutput);

    if (claims.length === 0) {
      return {
        originalOutput: llmOutput,
        claims: [],
        groundingResults: [],
        overallConfidence: 0.5, // Neutral confidence when no claims extracted
        overallStrength: 0.5,
        validatedOutput: llmOutput,
        warnings: ['No verifiable claims extracted from output'],
        ungroundedClaims: [],
        timestamp,
      };
    }

    // Step 2: Ground each claim against the AtomSpace
    const groundingResults: GroundingResult[] = [];
    for (const claim of claims) {
      const result = await this.groundClaim(claim);
      groundingResults.push(result);
    }

    // Step 3: Compute overall confidence using PLN revision rule
    const { overallConfidence, overallStrength } = this.computeOverallTruthValue(groundingResults);

    // Step 4: Identify ungrounded claims
    const ungroundedClaims = groundingResults
      .filter(r => !r.grounded)
      .map(r => r.claim);

    if (ungroundedClaims.length > 0) {
      warnings.push(
        `${ungroundedClaims.length}/${claims.length} claims could not be grounded in AtomSpace`
      );
    }

    // Step 5: Generate validated output with confidence annotations
    const validatedOutput = this.annotateOutput(llmOutput, groundingResults);

    return {
      originalOutput: llmOutput,
      claims,
      groundingResults,
      overallConfidence,
      overallStrength,
      validatedOutput,
      warnings,
      ungroundedClaims,
      timestamp,
    };
  }

  /**
   * Extract structured claims from LLM text output
   * Uses a secondary LLM call to parse claims into subject-predicate-object triples
   */
  private async extractClaims(text: string): Promise<ExtractedClaim[]> {
    const extractionPrompt = `Extract factual claims from the following text as JSON.
Each claim should have: subject, predicate, object, claimType (one of: inheritance, similarity, evaluation, implication).
Return ONLY a JSON array. If no clear factual claims, return [].

Text: "${text.substring(0, 2000)}"

JSON array of claims:`;

    try {
      const response = await this.ai.run(this.claimExtractionModel, {
        messages: [
          { role: 'system', content: 'You extract structured claims from text. Return only valid JSON arrays.' },
          { role: 'user', content: extractionPrompt },
        ],
        max_tokens: 1024,
      }) as { response?: string };

      if (!response?.response) return [];

      // Parse the JSON response
      const jsonMatch = response.response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const rawClaims = JSON.parse(jsonMatch[0]);
      return rawClaims.map((claim: any, index: number) => ({
        id: `claim-${Date.now()}-${index}`,
        subject: claim.subject || '',
        predicate: claim.predicate || '',
        object: claim.object || '',
        claimType: claim.claimType || 'evaluation',
        rawText: `${claim.subject} ${claim.predicate} ${claim.object}`,
        position: index,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Ground a single claim against the AtomSpace
   * Tries multiple grounding strategies in order of reliability
   */
  private async groundClaim(claim: ExtractedClaim): Promise<GroundingResult> {
    // Strategy 1: Direct match — find exact atoms for subject and object
    const directResult = await this.tryDirectMatch(claim);
    if (directResult.grounded) return directResult;

    // Strategy 2: PLN deduction — find inference chain
    const deductionResult = await this.tryPLNDeduction(claim);
    if (deductionResult.grounded) return deductionResult;

    // Strategy 3: PLN induction — find similar patterns
    const inductionResult = await this.tryPLNInduction(claim);
    if (inductionResult.grounded) return inductionResult;

    // Strategy 4: Embedding similarity — semantic search
    const embeddingResult = await this.tryEmbeddingSimilarity(claim);
    if (embeddingResult.grounded) return embeddingResult;

    // No grounding found
    return {
      claim,
      grounded: false,
      supportingAtoms: [],
      plnTruthValue: { strength: 0.3, confidence: 0.1 },
      groundingMethod: 'ungrounded',
      explanation: `No supporting evidence found in AtomSpace for: "${claim.rawText}"`,
    };
  }

  /**
   * Strategy 1: Direct match in AtomSpace
   */
  private async tryDirectMatch(claim: ExtractedClaim): Promise<GroundingResult> {
    const subjectAtom = await this.atomSpace.findNodeByName(claim.subject);
    const objectAtom = await this.atomSpace.findNodeByName(claim.object);

    if (subjectAtom && objectAtom) {
      // Look for a link between them
      const links = await this.atomSpace.findLinksByOutgoing([subjectAtom.id, objectAtom.id]);
      const matchingLink = links.find(l => this.linkTypeMatchesClaim(l.type, claim.claimType));

      if (matchingLink) {
        return {
          claim,
          grounded: true,
          supportingAtoms: [subjectAtom.id, objectAtom.id, matchingLink.id],
          plnTruthValue: matchingLink.truthValue,
          groundingMethod: 'direct_match',
          explanation: `Direct match found: ${matchingLink.type}(${claim.subject}, ${claim.object}) with TV(${matchingLink.truthValue.strength.toFixed(3)}, ${matchingLink.truthValue.confidence.toFixed(3)})`,
        };
      }
    }

    return { claim, grounded: false, supportingAtoms: [], plnTruthValue: { strength: 0, confidence: 0 }, groundingMethod: 'direct_match', explanation: '' };
  }

  /**
   * Strategy 2: PLN deduction chain
   */
  private async tryPLNDeduction(claim: ExtractedClaim): Promise<GroundingResult> {
    const subjectAtom = await this.atomSpace.findNodeByName(claim.subject);
    if (!subjectAtom) {
      return { claim, grounded: false, supportingAtoms: [], plnTruthValue: { strength: 0, confidence: 0 }, groundingMethod: 'pln_deduction', explanation: '' };
    }

    // Find outgoing links from subject
    const subjectLinks = await this.atomSpace.findRelated(subjectAtom.id, 'ImplicationLink');

    for (const intermediateLink of subjectLinks) {
      if (!intermediateLink.outgoing || intermediateLink.outgoing.length < 2) continue;
      const intermediateId = intermediateLink.outgoing[1];

      // Find links from intermediate to object
      const secondLinks = await this.atomSpace.findRelated(intermediateId, 'ImplicationLink');
      for (const secondLink of secondLinks) {
        if (!secondLink.outgoing || secondLink.outgoing.length < 2) continue;

        const objectAtom = await this.atomSpace.findNodeByName(claim.object);
        if (objectAtom && secondLink.outgoing[1] === objectAtom.id) {
          // Found a deduction chain: subject → intermediate → object
          const deductionResult = PLNReasoning.deduction(
            { ...intermediateLink, outgoing: intermediateLink.outgoing } as any,
            { ...secondLink, outgoing: secondLink.outgoing } as any
          );

          if (deductionResult) {
            return {
              claim,
              grounded: true,
              supportingAtoms: [subjectAtom.id, intermediateId, objectAtom.id],
              plnTruthValue: deductionResult.truthValue,
              groundingMethod: 'pln_deduction',
              explanation: `PLN deduction chain found via intermediate atom. TV(${deductionResult.truthValue.strength.toFixed(3)}, ${deductionResult.truthValue.confidence.toFixed(3)})`,
            };
          }
        }
      }
    }

    return { claim, grounded: false, supportingAtoms: [], plnTruthValue: { strength: 0, confidence: 0 }, groundingMethod: 'pln_deduction', explanation: '' };
  }

  /**
   * Strategy 3: PLN induction (find similar patterns)
   */
  private async tryPLNInduction(claim: ExtractedClaim): Promise<GroundingResult> {
    const subjectAtom = await this.atomSpace.findNodeByName(claim.subject);
    if (!subjectAtom) {
      return { claim, grounded: false, supportingAtoms: [], plnTruthValue: { strength: 0, confidence: 0 }, groundingMethod: 'pln_induction', explanation: '' };
    }

    // Find similar atoms to the subject
    const similarLinks = await this.atomSpace.findRelated(subjectAtom.id, 'SimilarityLink');

    for (const simLink of similarLinks) {
      if (!simLink.outgoing || simLink.outgoing.length < 2) continue;
      const similarAtomId = simLink.outgoing.find(id => id !== subjectAtom.id);
      if (!similarAtomId) continue;

      // Check if the similar atom has the claimed relationship
      const relatedLinks = await this.atomSpace.findRelated(similarAtomId, 'ImplicationLink');
      for (const relLink of relatedLinks) {
        if (!relLink.outgoing || relLink.outgoing.length < 2) continue;
        const objectAtom = await this.atomSpace.findNodeByName(claim.object);
        if (objectAtom && relLink.outgoing[1] === objectAtom.id) {
          // Induction: similar(A, B) and B→C implies A→C with reduced confidence
          const inductedStrength = simLink.truthValue.strength * relLink.truthValue.strength;
          const inductedConfidence = simLink.truthValue.confidence * relLink.truthValue.confidence * 0.6;

          return {
            claim,
            grounded: true,
            supportingAtoms: [subjectAtom.id, similarAtomId, objectAtom.id],
            plnTruthValue: { strength: inductedStrength, confidence: inductedConfidence },
            groundingMethod: 'pln_induction',
            explanation: `PLN induction via similarity: similar(${claim.subject}, intermediate) and intermediate→${claim.object}. TV(${inductedStrength.toFixed(3)}, ${inductedConfidence.toFixed(3)})`,
          };
        }
      }
    }

    return { claim, grounded: false, supportingAtoms: [], plnTruthValue: { strength: 0, confidence: 0 }, groundingMethod: 'pln_induction', explanation: '' };
  }

  /**
   * Strategy 4: Embedding similarity via semantic search
   */
  private async tryEmbeddingSimilarity(claim: ExtractedClaim): Promise<GroundingResult> {
    try {
      const results = await this.atomSpace.semanticSearch(claim.rawText, 5);

      if (results.length > 0) {
        // Use the best match's truth value, discounted by semantic distance
        const bestMatch = results[0];
        const discountFactor = 0.5; // Embedding match is less reliable than symbolic
        const strength = bestMatch.truthValue.strength * discountFactor;
        const confidence = bestMatch.truthValue.confidence * discountFactor * 0.5;

        if (strength > 0.3 && confidence > 0.1) {
          return {
            claim,
            grounded: true,
            supportingAtoms: results.map(r => r.id),
            plnTruthValue: { strength, confidence },
            groundingMethod: 'embedding_similarity',
            explanation: `Semantic similarity match found: "${bestMatch.name}" (discounted TV: ${strength.toFixed(3)}, ${confidence.toFixed(3)})`,
          };
        }
      }
    } catch (error) {
      // Vectorize may not be provisioned yet
    }

    return { claim, grounded: false, supportingAtoms: [], plnTruthValue: { strength: 0, confidence: 0 }, groundingMethod: 'embedding_similarity', explanation: '' };
  }

  /**
   * Compute overall truth value using PLN revision rule
   * Combines multiple independent evidence sources
   */
  private computeOverallTruthValue(results: GroundingResult[]): { overallConfidence: number; overallStrength: number } {
    if (results.length === 0) return { overallConfidence: 0.5, overallStrength: 0.5 };

    const groundedResults = results.filter(r => r.grounded);
    if (groundedResults.length === 0) {
      return { overallConfidence: 0.1, overallStrength: 0.3 };
    }

    // PLN Revision Rule: combine independent evidence
    // s_new = (s1*c1 + s2*c2) / (c1 + c2)
    // c_new = c1 + c2 - c1*c2 (assuming independence)
    let weightedStrengthSum = 0;
    let confidenceSum = 0;
    let combinedConfidence = 0;

    for (const result of groundedResults) {
      const { strength, confidence } = result.plnTruthValue;
      weightedStrengthSum += strength * confidence;
      confidenceSum += confidence;
      combinedConfidence = combinedConfidence + confidence - combinedConfidence * confidence;
    }

    const overallStrength = confidenceSum > 0 ? weightedStrengthSum / confidenceSum : 0.5;
    const overallConfidence = Math.min(combinedConfidence, 0.99); // Cap at 0.99

    return { overallConfidence, overallStrength };
  }

  /**
   * Annotate the original output with grounding confidence markers
   */
  private annotateOutput(originalOutput: string, results: GroundingResult[]): string {
    const groundedCount = results.filter(r => r.grounded).length;
    const totalClaims = results.length;

    if (totalClaims === 0) return originalOutput;

    const annotation = `\n\n[PLN Validation: ${groundedCount}/${totalClaims} claims grounded in AtomSpace]`;
    return originalOutput + annotation;
  }

  /**
   * Map claim type to expected link type
   */
  private linkTypeMatchesClaim(linkType: string, claimType: string): boolean {
    const mapping: Record<string, string[]> = {
      'inheritance': ['InheritanceLink', 'SubsetLink'],
      'similarity': ['SimilarityLink', 'ExtensionalSimilarityLink'],
      'evaluation': ['EvaluationLink', 'MemberLink'],
      'implication': ['ImplicationLink', 'PredictiveImplicationLink'],
    };
    return (mapping[claimType] || []).includes(linkType);
  }
}
