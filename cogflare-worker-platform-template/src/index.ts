import { Hono } from "hono";
import { Env, CognitiveDashboardData } from "./types/cognitive";
import { AtomSpace } from "./durable-objects/AtomSpace";
import { MindAgent } from "./durable-objects/MindAgent";

/**
 * Cogflare OpenCog Worker Platform
 * 
 * A distributed cognitive architecture based on OpenCog, running on Cloudflare Workers.
 * Provides AtomSpace hypergraph knowledge representation, autonomous MindAgents,
 * and goal-oriented cognitive processing across the edge.
 */

const app = new Hono<{ Bindings: Env }>();

// CORS middleware for development
app.use('*', async (c, next) => {
	// Set CORS headers
	c.res.headers.set('Access-Control-Allow-Origin', '*');
	c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	
	if (c.req.method === 'OPTIONS') {
		return c.text('', 200);
	}
	
	await next();
});

/**
 * Root endpoint - Cognitive Platform Status
 */
app.get('/', async (c) => {
	const atomSpaceId = c.env.ATOMSPACE.idFromName("primary");
	const atomSpaceStub = c.env.ATOMSPACE.get(atomSpaceId);
	
	const mindAgentId = c.env.MIND_AGENT.idFromName("primary");
	const mindAgentStub = c.env.MIND_AGENT.get(mindAgentId);

	try {
		// Get AtomSpace stats
		const atomSpaceResponse = await atomSpaceStub.fetch(new Request("http://dummy/stats"));
		const atomSpaceStats = await atomSpaceResponse.json();

		// Get MindAgent stats
		const agentsResponse = await mindAgentStub.fetch(new Request("http://dummy/agents"));
		const agentsData = await agentsResponse.json();

		const goalsResponse = await mindAgentStub.fetch(new Request("http://dummy/goals"));
		const goalsData = await goalsResponse.json();

		const status = {
			platform: "Cogflare OpenCog Platform",
			version: "1.0.0",
			status: "active",
			atomSpace: atomSpaceStats.success ? atomSpaceStats.data : null,
			mindAgents: {
				total: agentsData.success ? agentsData.data.length : 0,
				active: agentsData.success ? agentsData.data.filter((a: any) => a.enabled).length : 0
			},
			goals: {
				total: goalsData.success ? goalsData.data.length : 0,
				active: goalsData.success ? goalsData.data.filter((g: any) => g.status === 'active').length : 0
			},
			timestamp: Date.now()
		};

		return c.json(status);
	} catch (error) {
		return c.json({
			platform: "Cogflare OpenCog Platform",
			version: "1.0.0",
			status: "error",
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: Date.now()
		}, 500);
	}
});

/**
 * AtomSpace API Routes
 */
app.route('/atomspace/*', async (c) => {
	const atomSpaceId = c.env.ATOMSPACE.idFromName("primary");
	const atomSpaceStub = c.env.ATOMSPACE.get(atomSpaceId);
	
	// Forward request to AtomSpace Durable Object
	const url = new URL(c.req.url);
	url.pathname = url.pathname.replace('/atomspace', '');
	
	const forwardedRequest = new Request(url.toString(), {
		method: c.req.method,
		headers: c.req.headers,
		body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.arrayBuffer() : undefined
	});

	const response = await atomSpaceStub.fetch(forwardedRequest);
	return new Response(response.body, {
		status: response.status,
		headers: response.headers
	});
});

/**
 * MindAgent API Routes
 */
app.route('/mindagent/*', async (c) => {
	const mindAgentId = c.env.MIND_AGENT.idFromName("primary");
	const mindAgentStub = c.env.MIND_AGENT.get(mindAgentId);
	
	// Forward request to MindAgent Durable Object
	const url = new URL(c.req.url);
	url.pathname = url.pathname.replace('/mindagent', '');
	
	const forwardedRequest = new Request(url.toString(), {
		method: c.req.method,
		headers: c.req.headers,
		body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.arrayBuffer() : undefined
	});

	const response = await mindAgentStub.fetch(forwardedRequest);
	return new Response(response.body, {
		status: response.status,
		headers: response.headers
	});
});

/**
 * Cognitive Dashboard API
 */
app.get('/api/dashboard', async (c) => {
	try {
		const atomSpaceId = c.env.ATOMSPACE.idFromName("primary");
		const atomSpaceStub = c.env.ATOMSPACE.get(atomSpaceId);
		
		const mindAgentId = c.env.MIND_AGENT.idFromName("primary");
		const mindAgentStub = c.env.MIND_AGENT.get(mindAgentId);

		// Get comprehensive cognitive data
		const [atomSpaceResponse, agentsResponse, goalsResponse] = await Promise.all([
			atomSpaceStub.fetch(new Request("http://dummy/stats")),
			mindAgentStub.fetch(new Request("http://dummy/agents")),
			mindAgentStub.fetch(new Request("http://dummy/goals"))
		]);

		const atomSpaceData = await atomSpaceResponse.json();
		const agentsData = await agentsResponse.json();
		const goalsData = await goalsResponse.json();

		const dashboardData: CognitiveDashboardData = {
			atomSpace: atomSpaceData.success ? atomSpaceData.data : {
				totalAtoms: 0,
				nodeCount: 0,
				linkCount: 0,
				averageTruthValue: { strength: 0, confidence: 0 },
				averageAttentionValue: { sti: 0, lti: 0, vlti: 0 }
			},
			mindAgents: {
				activeAgents: agentsData.success ? agentsData.data.filter((a: any) => a.enabled).length : 0,
				totalExecutions: 0, // Would need to track this
				averageExecutionTime: 0, // Would need to calculate this
				recentResults: [] // Would need to store recent execution results
			},
			goals: {
				activeGoals: goalsData.success ? goalsData.data.filter((g: any) => g.status === 'active').length : 0,
				completedGoals: goalsData.success ? goalsData.data.filter((g: any) => g.status === 'completed').length : 0,
				averagePriority: goalsData.success ? 
					goalsData.data.reduce((sum: number, g: any) => sum + g.priority, 0) / goalsData.data.length : 0,
				recentGoals: goalsData.success ? goalsData.data.slice(-5) : []
			},
			performance: {
				operationsPerSecond: 0, // Would need to track this
				memoryUsage: 0, // Would need to estimate this
				responseTime: Date.now() // Simple timestamp for now
			}
		};

		return c.json(dashboardData);
	} catch (error) {
		return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
	}
});

/**
 * Cognitive Operations API
 */
app.post('/api/cognitive/perceive', async (c) => {
	try {
		const { input, inputType = "text" } = await c.req.json();
		
		const atomSpaceId = c.env.ATOMSPACE.idFromName("primary");
		const atomSpaceStub = c.env.ATOMSPACE.get(atomSpaceId);

		// Create a concept node for the input
		const conceptResponse = await atomSpaceStub.fetch(new Request("http://dummy/node", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "ConceptNode",
				name: `input_${Date.now()}`,
				truthValue: { strength: 0.8, confidence: 0.9 },
				attentionValue: { sti: 100, lti: 0, vlti: 0 }
			})
		}));

		const conceptData = await conceptResponse.json();

		return c.json({
			success: true,
			message: "Input perceived and added to AtomSpace",
			data: conceptData.data,
			timestamp: Date.now()
		});
	} catch (error) {
		return c.json({ 
			success: false,
			error: error instanceof Error ? error.message : "Unknown error" 
		}, 500);
	}
});

/**
 * AI-Enhanced Reasoning
 */
app.post('/api/cognitive/reason', async (c) => {
	try {
		const { query, context } = await c.req.json();
		
		// Use Cloudflare AI for enhanced reasoning
		const aiResponse = await c.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
			messages: [
				{
					role: "system",
					content: "You are a cognitive reasoning engine. Analyze the query in the context of a cognitive architecture and provide insights."
				},
				{
					role: "user",
					content: `Query: ${query}\nContext: ${context || "No additional context provided"}`
				}
			]
		});

		const atomSpaceId = c.env.ATOMSPACE.idFromName("primary");
		const atomSpaceStub = c.env.ATOMSPACE.get(atomSpaceId);

		// Store the reasoning result in AtomSpace
		const reasoningNode = await atomSpaceStub.fetch(new Request("http://dummy/node", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "ConceptNode",
				name: `reasoning_${Date.now()}`,
				truthValue: { strength: 0.7, confidence: 0.8 },
				attentionValue: { sti: 80, lti: 10, vlti: 0 }
			})
		}));

		return c.json({
			success: true,
			reasoning: aiResponse.response,
			atomSpaceEntry: (await reasoningNode.json()).data,
			timestamp: Date.now()
		});
	} catch (error) {
		return c.json({ 
			success: false,
			error: error instanceof Error ? error.message : "Unknown error" 
		}, 500);
	}
});

/**
 * Health check endpoint
 */
app.get('/health', async (c) => {
	return c.json({
		status: "healthy",
		platform: "Cogflare OpenCog Platform",
		timestamp: Date.now()
	});
});

/**
 * Serve static files from public directory
 */
app.get('/*', async (c) => {
	const url = new URL(c.req.url);
	let filePath = url.pathname;
	
	// Default to index.html for root path
	if (filePath === '/' || filePath === '') {
		filePath = '/index.html';
	}
	
	try {
		// Simple static file serving - in production you'd want more robust handling
		const response = await fetch(`${url.origin}/public${filePath}`);
		if (response.ok) {
			return response;
		}
		
		// Fallback to index.html for SPA routing
		const indexResponse = await fetch(`${url.origin}/public/index.html`);
		return indexResponse;
	} catch (error) {
		// Return a simple HTML response if file serving fails
		return c.html(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Cogflare OpenCog Platform</title>
				<style>
					body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
					.container { max-width: 600px; margin: 0 auto; text-align: center; }
					h1 { font-size: 2.5rem; margin-bottom: 1rem; }
					p { font-size: 1.1rem; margin-bottom: 2rem; }
					.error { background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; }
				</style>
			</head>
			<body>
				<div class="container">
					<h1>🧠 Cogflare OpenCog Platform</h1>
					<p>Autonomous cognitive architecture powered by Cloudflare Workers</p>
					<div class="error">
						<p>Static file serving not available. Please use the API endpoints directly:</p>
						<ul style="text-align: left; max-width: 400px; margin: 0 auto;">
							<li>GET /health - Health check</li>
							<li>GET /api/dashboard - Cognitive dashboard data</li>
							<li>POST /api/cognitive/perceive - Perception input</li>
							<li>POST /api/cognitive/reason - AI reasoning</li>
							<li>GET /atomspace/stats - AtomSpace statistics</li>
							<li>GET /mindagent/agents - MindAgent information</li>
						</ul>
					</div>
				</div>
			</body>
			</html>
		`);
	}
});

/**
 * Export the Durable Object classes and main handler
 */
export { AtomSpace, MindAgent };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return app.fetch(request, env, ctx);
	}
} satisfies ExportedHandler<Env>;


================================================================================
Content from: index (2).ts
================================================================================

export default {
	async fetch(request, env) {
		const inputs = {
			prompt: "cyberpunk cat",
		};

		const response = await env.AI.run(
			"@cf/stabilityai/stable-diffusion-xl-base-1.0",
			inputs,
		);

		return new Response(response, {
			headers: {
				"content-type": "image/png",
			},
		});
	},
} satisfies ExportedHandler<Env>;


================================================================================
Content from: index (3).ts
================================================================================

import { R2Explorer } from "r2-explorer";

export default R2Explorer({
	// Set to false to allow users to upload files
	readonly: true,

	// Learn more how to secure your R2 Explorer instance:
	// https://r2explorer.com/getting-started/security/
	// cfAccessTeamName: "my-team-name",
});


================================================================================
Content from: index (4).ts
================================================================================

import { Client } from "pg";

interface Env {
	HYPERDRIVE: Hyperdrive;
	ASSETS: Fetcher;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle API requests
		if (url.pathname.startsWith("/api/")) {
			return handleApiRequest(request, env, ctx);
		}

		return Response.json({ message: "Hello World!" });
	},
};

async function handleApiRequest(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<Response> {
	const url = new URL(request.url);
	console.log(env.HYPERDRIVE.connectionString);
	const client = new Client({
		connectionString: env.HYPERDRIVE.connectionString,
	});

	try {
		await client.connect();
		// API endpoint to check if tables exist
		if (url.pathname === "/api/check-tables" && request.method === "GET") {
			const tables = await client.query(
				`SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name = 'organizations' OR table_name = 'users')`,
			);
			console.log("tables", tables);

			const existingTables = tables.rows.map((t) => t.table_name);

			return Response.json({
				organizations: existingTables.includes("organizations"),
				users: existingTables.includes("users"),
			});
		}

		// API endpoint to initialize tables
		if (url.pathname === "/api/initialize" && request.method === "POST") {
			// Create organizations table
			await client.query(`
        CREATE TABLE IF NOT EXISTS organizations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

			// Create trigger for updated_at
			await client.query(`
        CREATE OR REPLACE FUNCTION update_modified_column() 
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

			await client.query(`
        DROP TRIGGER IF EXISTS update_organizations_modtime ON organizations
      `);

			await client.query(`
        CREATE TRIGGER update_organizations_modtime
        BEFORE UPDATE ON organizations
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column()
      `);

			// Create users table with foreign key
			await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          organization_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
        )
      `);

			await client.query(`
        DROP TRIGGER IF EXISTS update_users_modtime ON users
      `);

			await client.query(`
        CREATE TRIGGER update_users_modtime
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column()
      `);

			return Response.json({
				success: true,
				message: "Tables initialized successfully",
			});
		}

		// API endpoint for Organizations GET operation
		if (url.pathname === "/api/organizations" && request.method === "GET") {
			const result = await client.query(
				`SELECT * FROM organizations ORDER BY id`,
			);
			return Response.json(result.rows);
		}

		// API endpoint for Organizations POST operation
		if (url.pathname === "/api/organizations" && request.method === "POST") {
			const body: any = await request.json();

			if (!body.name || typeof body.name !== "string") {
				return Response.json(
					{ error: "Organization name is required" },
					{ status: 400 },
				);
			}

			const result = await client.query(
				`INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
				[body.name],
			);

			return Response.json({
				success: true,
				message: "Organization created successfully",
				id: result.rows[0].id,
			});
		}

		// API endpoint for Organizations DELETE operation
		if (
			url.pathname.startsWith("/api/organizations/") &&
			request.method === "DELETE"
		) {
			const orgId = Number(url.pathname.split("/").pop());

			// First check if there are any users associated with this organization
			const userCheck = await client.query(
				`SELECT COUNT(*) as count FROM users WHERE organization_id = $1`,
				[orgId],
			);

			if (Number(userCheck.rows[0].count) > 0) {
				return Response.json(
					{
						error: "Cannot delete organization with associated users",
					},
					{ status: 400 },
				);
			}

			await client.query(`DELETE FROM organizations WHERE id = $1`, [orgId]);
			return Response.json({
				success: true,
				message: "Organization deleted successfully",
			});
		}

		// API endpoint for Users GET operation
		if (url.pathname === "/api/users" && request.method === "GET") {
			const orgFilter = url.searchParams.get("organization_id");

			let result;
			if (orgFilter) {
				result = await client.query(
					`SELECT users.*, organizations.name as organization_name 
          FROM users 
          LEFT JOIN organizations ON users.organization_id = organizations.id
          WHERE organization_id = $1
          ORDER BY users.id`,
					[Number(orgFilter)],
				);
			} else {
				result = await client.query(
					`SELECT users.*, organizations.name as organization_name 
          FROM users 
          LEFT JOIN organizations ON users.organization_id = organizations.id
          ORDER BY users.id`,
				);
			}

			return Response.json(result.rows);
		}

		// API endpoint for Users POST operation
		if (url.pathname === "/api/users" && request.method === "POST") {
			const body: any = await request.json();

			if (!body.username || typeof body.username !== "string") {
				return Response.json(
					{ error: "Username is required" },
					{ status: 400 },
				);
			}

			// Organization ID is optional (can be null)
			const orgId = body.organization_id ? Number(body.organization_id) : null;

			// If organization_id is provided, verify it exists
			if (orgId !== null) {
				const orgCheck = await client.query(
					`SELECT id FROM organizations WHERE id = $1`,
					[orgId],
				);

				if (orgCheck.rows.length === 0) {
					return Response.json(
						{ error: "Organization not found" },
						{ status: 400 },
					);
				}
			}

			const result = await client.query(
				`INSERT INTO users (username, organization_id) 
        VALUES ($1, $2) 
        RETURNING id`,
				[body.username, orgId],
			);

			return Response.json({
				success: true,
				message: "User created successfully",
				id: result.rows[0].id,
			});
		}

		// API endpoint for Users PUT operation
		if (url.pathname.startsWith("/api/users/") && request.method === "PUT") {
			const userId = Number(url.pathname.split("/").pop());
			const body: any = await request.json();

			if (!body.username || typeof body.username !== "string") {
				return Response.json(
					{ error: "Username is required" },
					{ status: 400 },
				);
			}

			// Organization ID is optional (can be null)
			const orgId =
				body.organization_id !== undefined
					? body.organization_id
						? Number(body.organization_id)
						: null
					: undefined;

			// If organization_id is provided, verify it exists
			if (orgId !== undefined && orgId !== null) {
				const orgCheck = await client.query(
					`SELECT id FROM organizations WHERE id = $1`,
					[orgId],
				);

				if (orgCheck.rows.length === 0) {
					return Response.json(
						{ error: "Organization not found" },
						{ status: 400 },
					);
				}
			}

			if (orgId !== undefined) {
				await client.query(
					`UPDATE users SET username = $1, organization_id = $2
          WHERE id = $3`,
					[body.username, orgId, userId],
				);
			} else {
				await client.query(
					`UPDATE users SET username = $1
          WHERE id = $2`,
					[body.username, userId],
				);
			}

			return Response.json({
				success: true,
				message: "User updated successfully",
			});
		}

		// API endpoint for Users DELETE operation
		if (url.pathname.startsWith("/api/users/") && request.method === "DELETE") {
			const userId = Number(url.pathname.split("/").pop());
			await client.query(`DELETE FROM users WHERE id = $1`, [userId]);

			return Response.json({
				success: true,
				message: "User deleted successfully",
			});
		}

		return Response.json({ error: "Not Found" }, { status: 404 });
	} catch (error) {
		console.error("Database error:", error);
		return Response.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	} finally {
		// Clean up the connection
		ctx.waitUntil(client.end());
	}
}


================================================================================
Content from: index (5).ts
================================================================================

import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

// This value should be shared between the OpenAuth server Worker and other
// client Workers that you connect to it, so the types and schema validation are
// consistent.
const subjects = createSubjects({
	user: object({
		id: string(),
	}),
});

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// This top section is just for demo purposes. In a real setup another
		// application would redirect the user to this Worker to be authenticated,
		// and after signing in or registering the user would be redirected back to
		// the application they came from. In our demo setup there is no other
		// application, so this Worker needs to do the initial redirect and handle
		// the callback redirect on completion.
		const url = new URL(request.url);
		if (url.pathname === "/") {
			url.searchParams.set("redirect_uri", url.origin + "/callback");
			url.searchParams.set("client_id", "your-client-id");
			url.searchParams.set("response_type", "code");
			url.pathname = "/authorize";
			return Response.redirect(url.toString());
		} else if (url.pathname === "/callback") {
			return Response.json({
				message: "OAuth flow complete!",
				params: Object.fromEntries(url.searchParams.entries()),
			});
		}

		// The real OpenAuth server code starts here:
		return issuer({
			storage: CloudflareStorage({
				namespace: env.AUTH_STORAGE,
			}),
			subjects,
			providers: {
				password: PasswordProvider(
					PasswordUI({
						// eslint-disable-next-line @typescript-eslint/require-await
						sendCode: async (email, code) => {
							// This is where you would email the verification code to the
							// user, e.g. using Resend:
							// https://resend.com/docs/send-with-cloudflare-workers
							console.log(`Sending code ${code} to ${email}`);
						},
						copy: {
							input_code: "Code (check Worker logs)",
						},
					}),
				),
			},
			theme: {
				title: "myAuth",
				primary: "#0051c3",
				favicon: "https://workers.cloudflare.com//favicon.ico",
				logo: {
					dark: "https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/db1e5c92-d3a6-4ea9-3e72-155844211f00/public",
					light:
						"https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fa5a3023-7da9-466b-98a7-4ce01ee6c700/public",
				},
			},
			success: async (ctx, value) => {
				return ctx.subject("user", {
					id: await getOrCreateUser(env, value.email),
				});
			},
		}).fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;

async function getOrCreateUser(env: Env, email: string): Promise<string> {
	const result = await env.AUTH_DB.prepare(
		`
		INSERT INTO user (email)
		VALUES (?)
		ON CONFLICT (email) DO UPDATE SET email = email
		RETURNING id;
		`,
	)
		.bind(email)
		.first<{ id: string }>();
	if (!result) {
		throw new Error(`Unable to process user: ${email}`);
	}
	console.log(`Found or created user ${result.id} with email ${email}`);
	return result.id;
}


================================================================================
Content from: index (6).ts
================================================================================

import { httpServerHandler } from "cloudflare:node";
import { createServer } from "node:http";

// Create your Node.js HTTP server
const server = createServer((req, res) => {
	if (req.url === "/") {
		res.writeHead(200, { "Content-Type": "text/html" });
		res.end("<h1>Welcome to my Node.js app on Workers!</h1>");
	} else if (req.url === "/api/status") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "ok", timestamp: Date.now() }));
	} else {
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not Found");
	}
});

server.listen(8080);

// Export the server as a Workers handler
export default httpServerHandler({ port: 8080 });


================================================================================
Content from: index (7).ts
================================================================================

import { handleAsk } from "./ask";
import { NLWebMcp } from "./nlweb-mcp-do";

const RATE_LIMITED_ROUTES = new Set(["/ask", "/mcp"]);

async function getNlWebResponse(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
) {
	const url = new URL(request.url);

	if (RATE_LIMITED_ROUTES.has(url.pathname)) {
		const clientIP = request.headers.get("CF-Connecting-IP");
		const rateLimitKey = `rate-limit-${clientIP}`;

		const { success } = await env.RATE_LIMITER.limit({ key: rateLimitKey });
		if (!success) {
			return new Response("Rate limit exceeded", { status: 429 });
		}
	}

	if (url.pathname === "/ask") {
		return handleAsk(request, env, env.RAG_ID, ctx);
	}

	if (url.pathname === "/mcp") {
		return NLWebMcp.serve("/mcp").fetch(request, env, {
			...ctx,
			props: {
				ragId: env.RAG_ID,
			},
		});
	}

	if (url.pathname === "/version") {
		return Response.json({
			version: "1.0.0",
		});
	}

	if (url.pathname === "/sites") {
		const url = new URL(request.url);
		return Response.json({
			"message-type": "sites",
			sites: [url.hostname],
		});
	}

	return env.ASSETS.fetch(request);
}

export default {
	async fetch(request, env, ctx) {
		const response = await getNlWebResponse(request, env, ctx);

		const newResponse = new Response(response.body, response);
		newResponse.headers.set("Access-Control-Allow-Origin", "*");
		newResponse.headers.set(
			"Access-Control-Allow-Methods",
			"GET, POST, OPTIONS",
		);
		newResponse.headers.set(
			"Access-Control-Allow-Headers",
			"Content-Type, mcp-session-id, mcp-protocol-version",
		);
		newResponse.headers.set(
			"Access-Control-Expose-Headers",
			"Content-Type, mcp-session-id, mcp-protocol-version",
		);
		return newResponse;
	},
} satisfies ExportedHandler<Env>;

export { NLWebMcp };


================================================================================
Content from: index (8).ts
================================================================================

import { createConnection } from "mysql2/promise";

interface Env {
	HYPERDRIVE: Hyperdrive;
	ASSETS: Fetcher;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle API requests
		if (url.pathname.startsWith("/api/")) {
			return handleApiRequest(request, env, ctx);
		}

		// Serve static assets for everything else
		return env.ASSETS.fetch(request);
	},
};

async function handleApiRequest(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<Response> {
	const url = new URL(request.url);
	const connection = await createConnection({
		host: env.HYPERDRIVE.host,
		user: env.HYPERDRIVE.user,
		password: env.HYPERDRIVE.password,
		database: env.HYPERDRIVE.database,
		port: env.HYPERDRIVE.port,

		// The following line is needed for mysql2 compatibility with Workers
		// mysql2 uses eval() to optimize result parsing for rows with > 100 columns
		// Configure mysql2 to use static parsing instead of eval() parsing with disableEval
		disableEval: true,
	});

	try {
		// API endpoint to check if tables exist
		if (url.pathname === "/api/check-tables" && request.method === "GET") {
			const [tables] = await connection.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND (table_name = 'organizations' OR table_name = 'users')
      `);

			const existingTables = (tables as any[]).map(
				(t) => t.TABLE_NAME || t.table_name,
			);

			return Response.json({
				organizations: existingTables.includes("organizations"),
				users: existingTables.includes("users"),
			});
		}

		// API endpoint to initialize tables
		if (url.pathname === "/api/initialize" && request.method === "POST") {
			// Create organizations table
			await connection.query(`
        CREATE TABLE IF NOT EXISTS organizations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

			// Create users table with foreign key
			await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          organization_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
        )
      `);

			return Response.json({
				success: true,
				message: "Tables initialized successfully",
			});
		}

		// API endpoint for Organizations GET operation
		if (url.pathname === "/api/organizations" && request.method === "GET") {
			const [rows] = await connection.query(
				"SELECT * FROM organizations ORDER BY id",
			);
			return Response.json(rows);
		}

		// API endpoint for Organizations POST operation
		if (url.pathname === "/api/organizations" && request.method === "POST") {
			const body = await request.json<{ name: string }>();

			if (!body.name || typeof body.name !== "string") {
				return Response.json(
					{ error: "Organization name is required" },
					{ status: 400 },
				);
			}

			const [result] = await connection.query(
				"INSERT INTO organizations (name) VALUES (?)",
				[body.name],
			);

			return Response.json({
				success: true,
				message: "Organization created successfully",
				id: (result as any).insertId,
			});
		}

		// API endpoint for Organizations DELETE operation
		if (
			url.pathname.startsWith("/api/organizations/") &&
			request.method === "DELETE"
		) {
			const orgId = Number(url.pathname.split("/").pop());

			// First check if there are any users associated with this organization
			const [userCheck] = await connection.query(
				"SELECT COUNT(*) as count FROM users WHERE organization_id = ?",
				[orgId],
			);

			if ((userCheck as any[])[0].count > 0) {
				return Response.json(
					{
						error: "Cannot delete organization with associated users",
					},
					{ status: 400 },
				);
			}

			await connection.query("DELETE FROM organizations WHERE id = ?", [orgId]);
			return Response.json({
				success: true,
				message: "Organization deleted successfully",
			});
		}

		// API endpoint for Users GET operation
		if (url.pathname === "/api/users" && request.method === "GET") {
			let query =
				"SELECT users.*, organizations.name as organization_name FROM users LEFT JOIN organizations ON users.organization_id = organizations.id";
			const params = [];

			// Filter by organization if specified
			const orgFilter = url.searchParams.get("organization_id");
			if (orgFilter) {
				query += " WHERE organization_id = ?";
				params.push(orgFilter);
			}

			query += " ORDER BY users.id";
			const [rows] = await connection.query(query, params);

			return Response.json(rows);
		}

		// API endpoint for Users POST operation
		if (url.pathname === "/api/users" && request.method === "POST") {
			const body = await request.json<{
				username: string;
				organization_id?: string;
			}>();

			if (!body.username || typeof body.username !== "string") {
				return Response.json(
					{ error: "Username is required" },
					{ status: 400 },
				);
			}

			// Organization ID is optional (can be null)
			const orgId = body.organization_id ? Number(body.organization_id) : null;

			// If organization_id is provided, verify it exists
			if (orgId !== null) {
				const [orgCheck] = await connection.query(
					"SELECT id FROM organizations WHERE id = ?",
					[orgId],
				);

				if ((orgCheck as any[]).length === 0) {
					return Response.json(
						{ error: "Organization not found" },
						{ status: 400 },
					);
				}
			}

			const [result] = await connection.query(
				"INSERT INTO users (username, organization_id) VALUES (?, ?)",
				[body.username, orgId],
			);

			return Response.json({
				success: true,
				message: "User created successfully",
				id: (result as any).insertId,
			});
		}

		// API endpoint for Users PUT operation
		if (url.pathname.startsWith("/api/users/") && request.method === "PUT") {
			const userId = Number(url.pathname.split("/").pop());
			const body = await request.json<{
				username: string;
				organization_id?: string;
			}>();

			if (!body.username || typeof body.username !== "string") {
				return Response.json(
					{ error: "Username is required" },
					{ status: 400 },
				);
			}

			// Organization ID is optional (can be null)
			const orgId =
				body.organization_id !== undefined
					? body.organization_id
						? Number(body.organization_id)
						: null
					: undefined;

			// If organization_id is provided, verify it exists
			if (orgId !== undefined && orgId !== null) {
				const [orgCheck] = await connection.query(
					"SELECT id FROM organizations WHERE id = ?",
					[orgId],
				);

				if ((orgCheck as any[]).length === 0) {
					return Response.json(
						{ error: "Organization not found" },
						{ status: 400 },
					);
				}
			}

			let query = "UPDATE users SET username = ?";
			const params: any[] = [body.username];

			if (orgId !== undefined) {
				query += ", organization_id = ?";
				params.push(orgId);
			}

			query += " WHERE id = ?";
			params.push(userId);

			await connection.query(query, params);

			return Response.json({
				success: true,
				message: "User updated successfully",
			});
		}

		// API endpoint for Users DELETE operation
		if (url.pathname.startsWith("/api/users/") && request.method === "DELETE") {
			const userId = Number(url.pathname.split("/").pop());
			await connection.query("DELETE FROM users WHERE id = ?", [userId]);

			return Response.json({
				success: true,
				message: "User deleted successfully",
			});
		}

		return Response.json({ error: "Not Found" }, { status: 404 });
	} catch (error) {
		console.error("Database error:", error);
		return Response.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	} finally {
		await connection.end();
	}
}


================================================================================
Content from: index (9).ts
================================================================================

/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// Default system prompt
const SYSTEM_PROMPT =
	"You are a helpful, friendly assistant. Provide concise and accurate responses.";

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			// Handle POST requests for chat
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}

			// Method not allowed for other request types
			return new Response("Method not allowed", { status: 405 });
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		// Parse JSON request body
		const { messages = [] } = (await request.json()) as {
			messages: ChatMessage[];
		};

		// Add system prompt if not present
		if (!messages.some((msg) => msg.role === "system")) {
			messages.unshift({ role: "system", content: SYSTEM_PROMPT });
		}

		const response = await env.AI.run(
			MODEL_ID,
			{
				messages,
				max_tokens: 1024,
			},
			{
				returnRawResponse: true,
				// Uncomment to use AI Gateway
				// gateway: {
				//   id: "YOUR_GATEWAY_ID", // Replace with your AI Gateway ID
				//   skipCache: false,      // Set to true to bypass cache
				//   cacheTtl: 3600,        // Cache time-to-live in seconds
				// },
			},
		);

		// Return streaming response
		return response;
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}


================================================================================
Content from: index (10).ts
================================================================================

import { DurableObject } from "cloudflare:workers";

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(): Promise<string> {
		let result = this.ctx.storage.sql
			.exec("SELECT 'Hello, World!' as greeting")
			.one() as { greeting: string };
		return result.greeting;
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		// Create a `DurableObjectId` for an instance of the `MyDurableObject`
		// class. The name of class is used to identify the Durable Object.
		// Requests from all Workers to the instance named
		// will go to a single globally unique Durable Object instance.
		const id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName(
			new URL(request.url).pathname,
		);

		// Create a stub to open a communication channel with the Durable
		// Object instance.
		const stub = env.MY_DURABLE_OBJECT.get(id);

		// Call the `sayHello()` RPC method on the stub to invoke the method on
		// the remote Durable Object instance
		const greeting = await stub.sayHello();

		return new Response(greeting);
	},
} satisfies ExportedHandler<Env>;


================================================================================
Content from: index (11).ts
================================================================================

import { renderHtml } from "./renderHtml";

export default {
	async fetch(request, env) {
		const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
		const { results } = await stmt.all();

		return new Response(renderHtml(JSON.stringify(results, null, 2)), {
			headers: {
				"content-type": "text/html",
			},
		});
	},
} satisfies ExportedHandler<Env>;


================================================================================
Content from: index (12).ts
================================================================================

import { Retries } from "durable-utils";

export type Env = {
	DB01: D1Database;
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// A. Create the Session.
		// When we create a D1 Session, we can continue where we left off from a previous
		// Session if we have that Session's last bookmark or use a constraint.
		const bookmark =
			request.headers.get("x-d1-bookmark") ?? "first-unconstrained";
		const session = env.DB01.withSession(bookmark);

		try {
			// Use this Session for all our Workers' routes.
			const response = await withTablesInitialized(
				request,
				session,
				handleRequest,
			);

			// B. Return the bookmark so we can continue the Session in another request.
			response.headers.set("x-d1-bookmark", session.getBookmark() ?? "");

			return response;
		} catch (e) {
			console.error({
				message: "Failed to handle request",
				error: String(e),
				errorProps: e,
				url,
				bookmark,
			});
			return Response.json(
				{ error: String(e), errorDetails: e },
				{ status: 500 },
			);
		}
	},
} satisfies ExportedHandler<Env>;

type Order = {
	orderId: string;
	customerId: string;
	quantity: number;
};

async function handleRequest(request: Request, session: D1DatabaseSession) {
	const { pathname } = new URL(request.url);

	const tsStart = Date.now();

	if (request.method === "GET" && pathname === "/api/orders") {
		// C. Session read query.
		return await Retries.tryWhile(async () => {
			const resp = await session.prepare("SELECT * FROM Orders").all();
			return Response.json(buildResponse(session, resp, tsStart));
		}, shouldRetry);
	} else if (request.method === "POST" && pathname === "/api/orders") {
		const order = await request.json<Order>();

		return await Retries.tryWhile(async () => {
			// D. Session write query.
			// Since this is a write query, D1 will transparently forward the query.
			await session
				.prepare("INSERT INTO Orders VALUES (?, ?, ?) ON CONFLICT DO NOTHING")
				.bind(order.customerId, order.orderId, order.quantity)
				.run();

			// E. Session read-after-write query.
			// In order for the application to be correct, this SELECT
			// statement must see the results of the INSERT statement above.
			const resp = await session.prepare("SELECT * FROM Orders").all();

			return Response.json(buildResponse(session, resp, tsStart));
		}, shouldRetry);
	} else if (request.method === "POST" && pathname === "/api/reset") {
		return await Retries.tryWhile(async () => {
			const resp = await resetTables(session);
			return Response.json(buildResponse(session, resp, tsStart));
		}, shouldRetry);
	}

	return new Response("Not found", { status: 404 });
}

function buildResponse(
	session: D1DatabaseSession,
	res: D1Result,
	tsStart: number,
) {
	return {
		d1Latency: Date.now() - tsStart,

		results: res.results,
		servedByRegion: res.meta.served_by_region ?? "",
		servedByPrimary: res.meta.served_by_primary ?? "",

		// Add the session bookmark inside the response body too.
		sessionBookmark: session.getBookmark(),
	};
}

function shouldRetry(err: unknown, nextAttempt: number) {
	const errMsg = String(err);
	const isRetryableError =
		errMsg.includes("Network connection lost") ||
		errMsg.includes("storage caused object to be reset") ||
		errMsg.includes("reset because its code was updated");
	if (nextAttempt <= 5 && isRetryableError) {
		return true;
	}
	return false;
}

/**
 * This is mostly for DEMO purposes to avoid having to do separate schema migrations step.
 * This will check if the error is because our main table is missing, and if it is create the table
 * and rerun the handler.
 */
async function withTablesInitialized(
	request: Request,
	session: D1DatabaseSession,
	handler: (request: Request, session: D1DatabaseSession) => Promise<Response>,
) {
	// We use clones of the body since if we parse it once, and then retry with the
	// same request, it will fail due to the body stream already being consumed.
	try {
		return await handler(request.clone(), session);
	} catch (e) {
		if (String(e).includes("no such table: Orders: SQLITE_ERROR")) {
			await initTables(session);
			return await handler(request.clone(), session);
		}
		throw e;
	}
}

async function initTables(session: D1DatabaseSession) {
	return await session
		.prepare(
			`CREATE TABLE IF NOT EXISTS Orders(
			customerId TEXT NOT NULL,
			orderId TEXT NOT NULL,
			quantity INTEGER NOT NULL,
			PRIMARY KEY (customerId, orderId)
		)`,
		)
		.all();
}

async function resetTables(session: D1DatabaseSession) {
	return await session
		.prepare(
			`DROP TABLE IF EXISTS Orders; CREATE TABLE IF NOT EXISTS Orders(
			customerId TEXT NOT NULL,
			orderId TEXT NOT NULL,
			quantity INTEGER NOT NULL,
			PRIMARY KEY (customerId, orderId)
		)`,
		)
		.all();
}


================================================================================
Content from: index (13).ts
================================================================================

import { Container, getContainer, getRandom } from "@cloudflare/containers";
import { Hono } from "hono";

export class MyContainer extends Container<Env> {
	// Port the container listens on (default: 8080)
	defaultPort = 8080;
	// Time before container sleeps due to inactivity (default: 30s)
	sleepAfter = "2m";
	// Environment variables passed to the container
	envVars = {
		MESSAGE: "I was passed in via the container class!",
	};

	// Optional lifecycle hooks
	override onStart() {
		console.log("Container successfully started");
	}

	override onStop() {
		console.log("Container successfully shut down");
	}

	override onError(error: unknown) {
		console.log("Container error:", error);
	}
}

// Create Hono app with proper typing for Cloudflare Workers
const app = new Hono<{
	Bindings: Env;
}>();

// Home route with available endpoints
app.get("/", (c) => {
	return c.text(
		"Available endpoints:\n" +
			"GET /container/<ID> - Start a container for each ID with a 2m timeout\n" +
			"GET /lb - Load balance requests over multiple containers\n" +
			"GET /error - Start a container that errors (demonstrates error handling)\n" +
			"GET /singleton - Get a single specific container instance",
	);
});

// Route requests to a specific container using the container ID
app.get("/container/:id", async (c) => {
	const id = c.req.param("id");
	const containerId = c.env.MY_CONTAINER.idFromName(`/container/${id}`);
	const container = c.env.MY_CONTAINER.get(containerId);
	return await container.fetch(c.req.raw);
});

// Demonstrate error handling - this route forces a panic in the container
app.get("/error", async (c) => {
	const container = getContainer(c.env.MY_CONTAINER, "error-test");
	return await container.fetch(c.req.raw);
});

// Load balance requests across multiple containers
app.get("/lb", async (c) => {
	const container = await getRandom(c.env.MY_CONTAINER, 3);
	return await container.fetch(c.req.raw);
});

// Get a single container instance (singleton pattern)
app.get("/singleton", async (c) => {
	const container = getContainer(c.env.MY_CONTAINER);
	return await container.fetch(c.req.raw);
});

export default app;


================================================================================
Content from: index (14).ts
================================================================================

#! /usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { upload } from "./upload";
import { lint } from "./lint";
import { generateNpmLockfiles, lintNpmLockfiles } from "./npm";
import { validateLiveDemoLinks } from "./validateLiveDemoLinks";
import { actionWithSummary } from "./util";
import { validateD2CButtons } from "./validateD2CButtons";
import { validateVersionPrivatePackageJson } from "./validateVersionPrivatePackageJson";
import { setupHooks } from "./setupHooks";
import { depsInfo } from "./depsInfo";
import { depsUpdate } from "./depsUpdate";
import deployLiveDemos from "./deployLiveDemos";
import { preview } from "./preview";

const program = new Command();

program.name("cli").description("a handy CLI for developing templates");

program
	.command("upload")
	.description("upload templates to the templates API")
	.argument(
		"[path-to-template(s)]",
		"path to directory containing template(s)",
		".",
	)
	.option("--staging", "use the staging API endpoint")
	.option("--hash <string>", "the latest commit hash on the branch")
	.requiredOption("--repoFullName <string>", "the owner/repo combination")
	.requiredOption("--branch <string>", "the branch or ref")
	.action((templateDirectory, options) => {
		const clientId = process.env.TEMPLATES_API_CLIENT_ID;
		const clientSecret = process.env.TEMPLATES_API_CLIENT_SECRET;
		if (!clientId || !clientSecret) {
			throw new Error(
				`Missing TEMPLATES_API_CLIENT_ID or TEMPLATES_API_CLIENT_SECRET`,
			);
		}
		const subdomain = options.staging
			? "workers-templates-staging"
			: "workers-templates";
		const [owner, repository] = options.repoFullName.split("/");
		return actionWithSummary("Upload", () =>
			upload({
				templateDirectory,
				seedRepo: {
					provider: "github",
					owner,
					repository,
					branch: options.branch,
				},
				version: options.hash
					? `${options.branch}.${options.hash}`
					: options.branch,
				latest: true,
				api: {
					endpoint: `https://${subdomain}.cfdata.org/api/v1/templates`,
					clientId,
					clientSecret,
				},
			}),
		);
	});

program
	.command("lint")
	.description("find and fix template style problems")
	.argument(
		"[path-to-template(s)]",
		"path to directory containing template(s)",
		".",
	)
	.option("--fix", "fix problems that can be automatically fixed")
	.action((templateDirectory, options) => {
		return actionWithSummary("Lint", () =>
			lint({ templateDirectory, fix: options.fix ?? false }),
		);
	});

program
	.command("generate-npm-lockfiles")
	.description("Generate npm lockfiles to improve install time of templates")
	.argument(
		"[path-to-template(s)]",
		"path to directory containing template(s)",
		".",
	)
	.action((templateDirectory) => {
		return actionWithSummary("Generate npm lockfiles", () =>
			generateNpmLockfiles({ templateDirectory }),
		);
	});

program
	.command("lint-npm-lockfiles")
	.description("Lint all templates to ensure npm lockfiles are up to date")
	.argument(
		"[path-to-template(s)]",
		"path to directory containing template(s)",
		".",
	)
	.action((templateDirectory) => {
		return actionWithSummary("Lint npm lockfiles", () =>
			lintNpmLockfiles({ templateDirectory }),
		);
	});

program
	.command("deploy-live-demos")
	.description("Builds and deploys each template in isolataion")
	.argument(
		"[path-to-template(s)]",
		"path to directory containing template(s)",
		".",
	)
	.action((templateDirectory) => {
		return actionWithSummary("Deploy live demos", () =>
			deployLiveDemos({ templateDirectory }),
		);
	});

program
	.command("validate-live-demo-links")
	.description("Ensures every template has a live demo that returns a 200")
	.argument(
		"[path-to-template(s)]",
		"path to directory containing template(s)",
		".",
	)
	.action((templateDirectory) => {
		return actionWithSummary("Validate live demo links", () =>
			validateLiveDemoLinks({ templateDirectory }),
		);
	});

program
	.command("validate-d2c-buttons")
	.description(
		"Ensures every template has a Deploy to Cloudflare button in the readme",
	)
	.argument(
		"[path-to-template(s)]",
		"path to directory containing template(s)",
		".",
	)
	.action((templateDirectory) => {
		return actionWithSummary("Validate Deploy to Cloudflare buttons", () =>
			validateD2CButtons({ templateDirectory }),
		);
	});

program
	.command("validate-version-private-package-json")
	.description(
		"Ensures every template has a private and non-versioned package.json",
	)
	.argument(
		"[path-to-template(s)]",
		"path to directory containing template(s)",
		".",
	)
	.action((templateDirectory) => {
		return actionWithSummary("Validate version and private package.json", () =>
			validateVersionPrivatePackageJson({ templateDirectory }),
		);
	});

program
	.command("preview")
	.description("Generates a preview for the templates in a PR")
	.argument(
		"<path-to-templates>",
		"path to directory containing preview templates",
	)
	.option("--staging", "use the staging API endpoint")
	.requiredOption("--repoFullName <string>", "the owner/repo combination")
	.requiredOption("--branch <string>", "the branch or ref")
	.requiredOption("--pr <string>", "the ID of the pull request")
	.requiredOption(
		"--hash <string>",
		"the latest commit hash of the pull request",
	)
	.action((templateDirectory, options) => {
		const clientId = process.env.TEMPLATES_API_CLIENT_ID;
		const clientSecret = process.env.TEMPLATES_API_CLIENT_SECRET;
		const githubToken = process.env.GITHUB_TOKEN;
		if (!clientId || !clientSecret) {
			throw new Error(
				`Missing TEMPLATES_API_CLIENT_ID or TEMPLATES_API_CLIENT_SECRET`,
			);
		}
		if (!githubToken) {
			throw new Error("Missing GITHUB_TOKEN");
		}
		const subdomain = options.staging
			? "workers-templates-staging"
			: "workers-templates";
		const [owner, repository] = options.repoFullName.split("/");
		return actionWithSummary("Preview", () =>
			preview({
				templateDirectory,
				githubToken,
				prId: options.pr,
				seedRepo: {
					provider: "github",
					owner,
					repository,
					branch: options.branch,
				},
				version: `preview.${options.pr}.${options.hash}`,
				api: {
					endpoint: `https://${subdomain}.cfdata.org/api/v1/templates`,
					clientId,
					clientSecret,
				},
			}),
		);
	});

program
	.command("deps-info")
	.description(
		"Lists out version info for dependencies that have been added or modified",
	)
	.requiredOption("--pr <string>", "the ID of the pull request")
	.action((options) => {
		const githubToken = process.env.GITHUB_TOKEN;
		if (!githubToken) {
			throw new Error("Missing GITHUB_TOKEN");
		}
		return actionWithSummary("Deps Info", () =>
			depsInfo({
				prId: options.pr,
				githubToken,
			}),
		);
	});

program
	.command("deps-update")
	.description(
		"Creates pull requests for each dependency that requires updating",
	)
	.requiredOption("--actor <string>", "the actor of the GitHub action")
	.action((options) => {
		const githubToken = process.env.GITHUB_TOKEN;
		if (!githubToken) {
			throw new Error("Missing GITHUB_TOKEN");
		}
		return actionWithSummary("Deps Update", () =>
			depsUpdate({
				githubToken,
				githubActor: options.actor,
			}),
		);
	});

program
	.command("setup-hooks")
	.description("sets up git hooks")
	.action(() => {
		setupHooks();
	});

program.parseAsync();


================================================================================
Content from: index (15).ts
================================================================================

import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
	if (err instanceof ApiException) {
		// If it's a Chanfana ApiException, let Chanfana handle the response
		return c.json(
			{ success: false, errors: err.buildResponse() },
			err.status as ContentfulStatusCode,
		);
	}

	console.error("Global error handler caught:", err); // Log the error if it's not known

	// For other errors, return a generic 500 response
	return c.json(
		{
			success: false,
			errors: [{ code: 7000, message: "Internal Server Error" }],
		},
		500,
	);
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
	schema: {
		info: {
			title: "My Awesome API",
			version: "2.0.0",
			description: "This is the documentation for my awesome API.",
		},
	},
});

// Register Tasks Sub router
openapi.route("/tasks", tasksRouter);

// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);

// Export the Hono app
export default app;
