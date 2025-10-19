# Worker Publisher

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/worker-publisher-template)

<!-- dash-content-start -->

A Cloudflare Worker that creates and deploys Workers to a Dispatch Namespace via the Cloudflare SDK.

## How it works

- Automatically creates a Workers for Platforms dispatch namespace
- Uses Cloudflare SDK to deploy Workers to the namespace
- Each deployed Worker gets its own /{worker-name} path
- Main Worker acts as a router, forwarding requests to deployed Workers
- Each deployed Worker runs in its own isolated environment

You can modify this and use it to deploy static sites or full stack applications at scale, build a vibe coding platform, deploy personalized AI agents ... the possibilities are endless!

<!-- dash-content-end -->

## Setup

After you click "Deploy to Cloudflare", you'll be prompted for:

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Workers:Edit permission


================================================================================
Content from: README (2).md
================================================================================

# React + Vite + Hono + Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/vite-react-template)

This template provides a minimal setup for building a React application with TypeScript and Vite, designed to run on Cloudflare Workers. It features hot module replacement, ESLint integration, and the flexibility of Workers deployments.

![React + TypeScript + Vite + Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fc7b4b62-442b-4769-641b-ad4422d74300/public)

<!-- dash-content-start -->

🚀 Supercharge your web development with this powerful stack:

- [**React**](https://react.dev/) - A modern UI library for building interactive interfaces
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**Hono**](https://hono.dev/) - Ultralight, modern backend framework
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform for global deployment

### ✨ Key Features

- 🔥 Hot Module Replacement (HMR) for rapid development
- 📦 TypeScript support out of the box
- 🛠️ ESLint configuration included
- ⚡ Zero-config deployment to Cloudflare's global network
- 🎯 API routes with Hono's elegant routing
- 🔄 Full-stack development setup
- 🔎 Built-in Observability to monitor your Worker

Get started in minutes with local development or deploy directly via the Cloudflare dashboard. Perfect for building modern, performant web applications at the edge.

<!-- dash-content-end -->

## Getting Started

To start a new project with this template, run:

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/vite-react-template
```

A live deployment of this template is available at:
[https://react-vite-template.templates.workers.dev](https://react-vite-template.templates.workers.dev)

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npm run build && npm run deploy
```

Monitor your workers:

```bash
npx wrangler tail
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)


================================================================================
Content from: README (3).md
================================================================================

# To-Do List App

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/to-do-list-kv-template)

![To-Do List Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/923473bc-a285-487c-93db-e0ddea3d3700/public)

<!-- dash-content-start -->

Manage your to-do list with [Cloudflare Workers Assets](https://developers.cloudflare.com/workers/static-assets/) + [Remix](https://remix.run/) + [Cloudflare Workers KV](https://developers.cloudflare.com/kv/).

## How It Works

This is a simple to-do list app that allows you to add, remove, and mark tasks as complete. The project is a Cloudflare Workers Assets application built with Remix. It uses Cloudflare Workers KV to store the to do list items. The [Remix Vite Plugin](https://remix.run/docs/en/main/guides/vite#vite) has a Cloudflare Dev Proxy that enables you to use [Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) provided by the Cloudflare Developer Platform. [Observability](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#enable-workers-logs) is on by default.

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/to-do-list-kv-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/to-do-list-kv-template
```

A live public deployment of this template is available at [https://to-do-list-kv-template.templates.workers.dev](https://to-do-list-kv-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [kv namespace](https://developers.cloudflare.com/kv/get-started/) with a binding named "TO_DO_LIST":
   ```bash
   npx wrangler kv namespace create TO_DO_LIST
   ```
   ...and update the `kv_namespaces` -> `id` field in `wrangler.json` with the new namespace ID.
3. Build the application:
   ```bash
   npm run build
   ```
4. Deploy it!
   ```bash
   npx wrangler deploy
   ```
5. And monitor your worker!
   ```bash
   npx wrangler tail
   ```


================================================================================
Content from: README (4).md
================================================================================

# Text To Image App

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/text-to-image-template)

![Text To Image Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/dddfe97e-e689-450b-d5a9-d49801da6a00/public)

<!-- dash-content-start -->

Generate images based on text prompts using [Workers AI](https://developers.cloudflare.com/workers-ai/). In this example, going to the website will generate an image from the prompt "cyberpunk cat" using the `@cf/stabilityai/stable-diffusion-xl-base-1.0` model. Be patient! Your image may take a few seconds to generate.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/text-to-image-template
```

A live public deployment of this template is available at [https://text-to-image-template.templates.workers.dev](https://text-to-image-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Deploy the project!
   ```bash
   npx wrangler deploy
   ```
3. Monitor your worker
   ```bash
   npx wrangler tail
   ```


================================================================================
Content from: README (5).md
================================================================================

# SaaS Admin Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/saas-admin-template)

![SaaS Admin Template](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/52b88668-0144-489c-dd02-fe620270ba00/public)

<!-- dash-content-start -->

A complete admin dashboard template built with Astro, Shadcn UI, and Cloudflare's developer stack. Quickly deploy a fully functional admin interface with customer and subscription management capabilities.

## Features

- 🎨 Modern UI built with Astro and Shadcn UI
- 🔐 Built-in API with token authentication
- 👥 Customer management
- 💳 Subscription tracking
- 🚀 Deploy to Cloudflare Workers
- 📦 Powered by Cloudflare D1 database
- ✨ Clean, responsive interface
- 🔍 Data validation with Zod

## Tech Stack

- Frontend: [Astro](https://astro.build)
- UI Components: [Shadcn UI](https://ui.shadcn.com)
- Database: [Cloudflare D1](https://developers.cloudflare.com/d1)
- Deployment: [Cloudflare Workers](https://workers.cloudflare.com)
- Validation: [Zod](https://github.com/colinhacks/zod)

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/d1-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables:

```bash
# Create a .dev.vars file for local development
cp .dev.vars.example .dev.vars
```

Add your API token:

```
API_TOKEN=your_token_here
```

_An API token is required to authenticate requests to the API. You should generate this before trying to run the project locally or deploying it._

3. Create a [D1 database](https://developers.cloudflare.com/d1/get-started/) with the name "admin-db":

```bash
npx wrangler d1 create admin-db
```

...and update the `database_id` field in `wrangler.json` with the new database ID.

4. Run the database migrations locally:

```bash
$ npm run db:migrate
```

Run the development server:

```bash
npm run dev
```

_If you're testing Workflows, you should run `npm run wrangler:dev` instead._

5. Build the application:

```bash
npm run build
```

6. Deploy to Cloudflare Workers:

```bash
npm run deploy
```

7. Run the database migrations remotely:

```bash
$ npm run db:migrate:remote
```

8. Set your production API token:

```bash
npx wrangler secret put API_TOKEN
```

## Usage

This project includes a fully functional admin dashboard with customer and subscription management capabilities. It also includes an API with token authentication to access resources via REST, returning JSON data.

It also includes a "Customer Workflow", built with [Cloudflare Workflows](https://developers.cloudflare.com/workflows). This workflow can be triggered in the UI or via the REST API to do arbitrary actions in the background for any given user. See [`customer_workflow.ts`]() to learn more about what you can do in this workflow.


================================================================================
Content from: README (6).md
================================================================================

# Welcome to Remix + Cloudflare Workers!

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/remix-starter-template)

<!-- dash-content-start -->

Build a fullstack Remix application, deployed to Cloudflare Workers.

- 📖 [Remix docs](https://remix.run/docs)
- 📖 [Remix Cloudflare docs](https://remix.run/guides/vite#cloudflare)

<!-- dash-content-end -->

## Development

Run the dev server:

```sh
npm run dev
```

To run Wrangler:

```sh
npm run build
npm start
```

## Typegen

Generate types for your Cloudflare bindings in `wrangler.toml`:

```sh
npm run typegen
```

You will need to rerun typegen whenever you make changes to `wrangler.toml`.

## Deployment

If you don't already have an account, then [create a cloudflare account here](https://dash.cloudflare.com/sign-up) and after verifying your email address with Cloudflare, go to your dashboard and set up your free custom Cloudflare Workers subdomain.

Once that's done, you should be able to build your app:

```sh
npm run build
```

And deploy it:

```sh
npm run deploy
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.


================================================================================
Content from: README (7).md
================================================================================

# Welcome to React Router + Cloudflare Workers!

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-router-starter-template)

![React Router Starter Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/bfdc2f85-e5c9-4c92-128b-3a6711249800/public)

<!-- dash-content-start -->

A modern, production-ready template for building full-stack React applications using [React Router](https://reactrouter.com/) and the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/).

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)
- 🔎 Built-in Observability to monitor your Worker
<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/react-router-starter-template
```

A live public deployment of this template is available at [https://react-router-starter-template.templates.workers.dev](https://react-router-starter-template.templates.workers.dev)

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Typegen

Generate types for your Cloudflare bindings in `wrangler.json`:

```sh
npm run typegen
```

## Building for Production

Create a production build:

```bash
npm run build
```

## Previewing the Production Build

Preview the production build locally:

```bash
npm run preview
```

## Deployment

If you don't have a Cloudflare account, [create one here](https://dash.cloudflare.com/sign-up)! Go to your [Workers dashboard](https://dash.cloudflare.com/?to=%2F%3Aaccount%2Fworkers-and-pages) to see your [free custom Cloudflare Workers subdomain](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) on `*.workers.dev`.

Once that's done, you can build your app:

```sh
npm run build
```

And deploy it:

```sh
npm run deploy
```

To deploy a preview URL:

```sh
npx wrangler versions upload
```

You can then promote a version to production after verification or roll it out progressively.

```sh
npx wrangler versions deploy
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.


================================================================================
Content from: README (8).md
================================================================================

# React Router 7 + PostgreSQL + Hyperdrive on Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-router-postgres-ssr-template)

<!-- dash-content-start -->

This project demonstrates a full-stack application with a React Router app with Server-Side Rendering (SSR), served through Cloudflare Workers. The backend consists of API routes built with Hono, running on Cloudflare Workers, connecting to a PostgreSQL database through Hyperdrive. Smart Placement is enabled to automatically position your Worker closer to your database for reduced latency.

<!-- dash-content-end -->

## Architecture Overview

This application demonstrates a full-stack architecture using Cloudflare Workers:

- **Frontend**: React with React Router 7 for both server and client-side rendering
  - Built with Vite and deployed as assets via Workers
- **Backend**: API routes served by a Worker using Hono framework
  - API endpoints defined in `/api/routes` directory
  - Automatic fallback to mock data when database is unavailable
- **Database**: PostgreSQL database connected via Cloudflare Hyperdrive
  - Smart Placement enabled for optimal performance
  - Handles missing connection strings or connection failures

## Smart Placement Benefits

This application uses Cloudflare Workers' [Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/) feature to optimize performance:

- **What is Smart Placement?** Smart Placement dynamically positions your Worker in Cloudflare's network to minimize latency between your Worker and database.

- **Why it's enabled in this app:** The application makes multiple database round trips per request. Smart Placement analyzes this traffic pattern and can choose to position the Worker and Hyperdrive closer to your deployed database to reduce latency.

- **Performance implications:** This can significantly improve response times, especially for read-intensive operations requiring multiple database queries, as demonstrated in the book-related API endpoints.

- **No configuration needed:** Smart Placement works automatically when enabled in `wrangler.jsonc` with `"mode": "smart"`.

## Rendering Modes

This application uses Server-Side Rendering (SSR) with React Router 7:

1. **Server-Side Rendering (SSR)**: Initial page loads are rendered on the server, which improves performance and SEO. This is configured in `react-router.config.js` with `ssr: true`.

2. **Client-Side Navigation**: After the initial server render, React Router takes over for smooth client-side navigation between routes.

3. **API-driven data fetching**: Backend data is retrieved from API endpoints that connect to either:
   - A real PostgreSQL database via Hyperdrive (production mode)
   - Mock data automatically provided when no database is available (demo mode)

## Deployment Options

This application can be deployed in two ways:

### Option 1: With Database (Full Experience)

1. Run `npm i`
2. Sign up for a PostgreSQL provider like [Neon](https://neon.tech) and create a database
3. Load the sample data using the provided SQL script:
   - The `/init.sql` file contains all database schema and sample data
   - You can either:
     - Copy and paste the contents into your database provider's SQL editor
     - Or use a command line tool like `psql`: `psql -h hostname -U username -d dbname -f init.sql`
4. Create a Hyperdrive connection by running:
   ```
   npx wrangler hyperdrive create <YOUR_CONFIG_NAME> --connection-string="<postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name>"
   ```
5. Uncomment and update the Hyperdrive binding in `wrangler.jsonc` with the ID from step 4:
   ```json
   "hyperdrive": [
     {
       "binding": "HYPERDRIVE",
       "id": "YOUR_HYPERDRIVE_ID",
       "localConnectionString": "postgresql://myuser:mypassword@localhost:5432/mydatabase"
     }
   ]
   ```
6. Build the application with `npm run build`
7. Deploy with `npm run deploy`
8. Monitor your worker with `npm wrangler tail`

### Option 2: Without Database (Demo Mode)

1. Run `npm i`
2. Keep the Hyperdrive binding commented out in `wrangler.jsonc` (this is the default)
3. Build the application with `npm run build`
4. Deploy with `npm run deploy`
5. The app will automatically use mock data instead of a real database

## Setting Up Hyperdrive Bindings

Hyperdrive is Cloudflare's database connector that provides optimized connections between your Workers and various database providers. Here's a detailed explanation of how to set it up:

1. **Create a Hyperdrive configuration**:

   ```
   npx wrangler hyperdrive create my-hyperdrive-config --connection-string="postgres://user:password@hostname:port/dbname"
   ```

   This command will return a Hyperdrive ID that you'll need for your configuration.

2. **Configure Hyperdrive in wrangler.jsonc**:

   ```json
   "hyperdrive": [
     {
       "binding": "HYPERDRIVE",  // Name used to access the binding in your code
       "id": "YOUR_HYPERDRIVE_ID",  // ID from the create command
       "localConnectionString": "postgresql://myuser:mypassword@localhost:5432/mydatabase"  // Local dev connection
     }
   ]
   ```

3. **Access in your code**:

   ```javascript
   // Example from this project
   if (c.env.HYPERDRIVE) {
   	const sql = postgres(c.env.HYPERDRIVE.connectionString);
   	// Use SQL client
   }
   ```

4. **Fallback handling**: This application automatically falls back to mock data if:
   - Hyperdrive binding is not configured
   - Database connection fails for any reason

## Running Locally

To run locally, you can use the Docker container defined in the docker compose:

1. `docker-compose up -d`
   - Creates container with PostgreSQL and seeds it with the "init.sql" data
2. `npm run dev`

If you update the "init.sql" file, make sure to run `docker-compose down -v` to teardown.

### Why Docker is Required for Local Development

When developing locally with Hyperdrive, you **must** use the Docker setup provided:

1. **Local connection requirements**: Hyperdrive's local development mode requires a database running on localhost with the exact configuration specified in `localConnectionString`
2. **Compatibility**: The Docker setup ensures the PostgreSQL instance is properly configured to work with the local Hyperdrive development environment
3. **Automatic configuration**: The container automatically runs the init.sql script to create tables and load sample data
4. **Connection reliability**: The Docker setup guarantees consistent connection behavior between your local Wrangler environment and the database
5. **Development/production parity**: Using Docker ensures your local development closely resembles the production environment

This approach is the recommended and supported method for local development with this application. Attempting to use a remote database for local development with Hyperdrive is not currently supported, but is being worked on.

## Resources

- [React Router Documentation](https://reactrouter.com/en/main)
- [Neon PostgreSQL with Cloudflare Workers and Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/neon/)
- [Cloudflare Vite Plugin](https://www.npmjs.com/package/@cloudflare/vite-plugin)
- [Cloudflare Hyperdrive Documentation](https://developers.cloudflare.com/hyperdrive/get-started/)
- [Hono - Fast, Lightweight, Web Framework for Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Workers Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/)


================================================================================
Content from: README (9).md
================================================================================

# Hono + React Router + Vite + ShadCN UI on Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-router-hono-fullstack-template)
![Build modern full-stack apps with Hono, React Router, and ShadCN UI on Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/24c5a7dd-e1e3-43a9-b912-d78d9a4293bc/public)

<!-- dash-content-start -->

A modern full-stack template powered by [Cloudflare Workers](https://workers.cloudflare.com/), using [Hono](https://hono.dev/) for backend APIs, [React Router](https://reactrouter.com/) for frontend routing, and [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components styled with [Tailwind CSS](https://tailwindcss.com/).

Built with the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) for optimized static asset delivery and seamless local development. React is configured in single-page app (SPA) mode via Workers.

A perfect starting point for building interactive, styled, and edge-deployed SPAs with minimal configuration.

## Features

- ⚡ Full-stack app on Cloudflare Workers
- 🔁 Hono for backend API endpoints
- 🧭 React Router for client-side routing
- 🎨 ShadCN UI with Tailwind CSS for components and styling
- 🧱 File-based route separation
- 🚀 Zero-config Vite build for Workers
- 🛠️ Automatically deploys with Wrangler
- 🔎 Built-in Observability to monitor your Worker
<!-- dash-content-end -->

## Tech Stack

- **Frontend**: React + React Router + ShadCN UI
  - SPA architecture powered by React Router
  - Includes accessible, themeable UI from ShadCN
  - Styled with utility-first Tailwind CSS
  - Built and optimized with Vite

- **Backend**: Hono on Cloudflare Workers
  - API routes defined and handled via Hono in `/api/*`
  - Supports REST-like endpoints, CORS, and middleware

- **Deployment**: Cloudflare Workers via Wrangler
  - Vite plugin auto-bundles frontend and backend together
  - Deployed worldwide on Cloudflare’s edge network

## Resources

- 🧩 [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- 📦 [Vite Plugin for Cloudflare](https://developers.cloudflare.com/workers/vite-plugin/)
- 🛠 [Wrangler CLI reference](https://developers.cloudflare.com/workers/wrangler/)
- 🎨 [shadcn/ui](https://ui.shadcn.com)
- 💨 [Tailwind CSS Documentation](https://tailwindcss.com/)
- 🔀 [React Router Docs](https://reactrouter.com/)


================================================================================
Content from: README (10).md
================================================================================

# React + Vite + PostgreSQL + Hyperdrive on Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-postgres-fullstack-template)

![Build a library of books using Cloudflare Workes Assets, Hono, and Hyperdrive](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/cd71c67a-253f-477d-022c-2f90cb4b3d00/public)

<!-- dash-content-start -->

Build a library of books using [Cloudflare Workers Assets](https://developers.cloudflare.com/workers/static-assets/), Hono API routes, and [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) to connect to a PostgreSQL database. [Workers Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/) is enabled to automatically position your Worker closer to your database for reduced latency.

Browse a categorized collection of books in this application. To learn more about a title, click on it to navigate to an expanded view. The collection can also be filtered by genre. If a custom database connection is not provided, a fallback set of books will be used.

If creating a personal database, books are expected to be stored in the following format:

```sql
(INDEX, 'BOOK_TITLE', 'BOOK_AUTHOR', 'BOOK_DESCRIPTION', '/images/books/BOOK_COVER_IMAGE.jpg', 'BOOK_GENRE')
```

## Features

- 📖 Dynamic routes
- 📦 Asset bundling and optimization
- 🌐 Optimized Worker placement
- 🚀 Database connection via Hyperdrive
- 🎉 TailwindCSS for styling
- 🐳 Docker for container management

## Smart Placement Benefits

This application uses Cloudflare Workers' [Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/) feature to optimize performance.

- **What is Smart Placement?** Smart Placement [can dynamically position](https://developers.cloudflare.com/workers/configuration/smart-placement/#understand-how-smart-placement-works) your Worker in Cloudflare's network to minimize latency between your Worker and database.

- **How does it work?** The application makes multiple database round trips per request. Smart Placement analyzes this traffic pattern and can choose to position the Worker and Hyperdrive closer to your deployed database to reduce latency. This can significantly improve response times, especially for read-intensive operations requiring multiple database queries — as demonstrated in this application's book-related API endpoints.

- **No configuration needed:** Smart Placement works automatically when enabled in `wrangler.jsonc` with `"mode": "smart"`.

<!-- dash-content-end -->

## Tech Stack

- **Frontend**: React + React Router for client-side navigation [using declarative routing](https://reactrouter.com/en/main/start/overview)
  - Built with Vite and deployed as static assets via Workers
  - React SPA mode enabled in `wrangler.jsonc` for client-side navigation

- **Backend**: API routes served by a Worker using [Hono](https://hono.dev/)
  - API endpoints defined in `/api/routes` directory
  - Automatic fallback to mock data when database is unavailable

- **Database**: PostgreSQL database connected via Cloudflare Hyperdrive
  - Smart Placement enabled for optimal performance
  - Handles missing connection strings or connection failures

## Get Started

To run the applicaton locally, use the Docker container defined in `docker-compose.yml`:

1. `docker-compose up -d`
   - Creates container with PostgreSQL and seeds it with the data found in `init.sql`
2. `npm run dev`

If you update `init.sql`, be sure to run `docker-compose down -v` to teardown the previous image.

### Setting Up Hyperdrive Bindings

Cloudflare's Hyperdrive is database connector that optimizes queries from your Workers to various database providers using a connection string. Here's a detailed explanation of how to set it up:

1. **Create a Hyperdrive configuration**:

   ```sh
   npx wrangler hyperdrive create my-hyperdrive-config --connection-string="postgres://user:password@hostname:port/dbname"
   ```

   This command will return the Hyperdrive ID that you'll need for your configuration.

2. **Configure Hyperdrive in wrangler.jsonc**:

   ```json
   "hyperdrive": [
     {
       "binding": "HYPERDRIVE",  // Name used to access the binding in your code
       "id": "YOUR_HYPERDRIVE_ID",  // ID from the create command
       "localConnectionString": "postgresql://myuser:mypassword@localhost:5432/mydatabase"  // Local dev connection
     }
   ]
   ```

3. **Access in your code**:

   ```javascript
   // Example from this project
   if (c.env.HYPERDRIVE) {
   	const sql = postgres(c.env.HYPERDRIVE.connectionString);
   	// Use SQL client
   }
   ```

4. **Fallback handling**: This application automatically falls back to mock data if:
   - Hyperdrive binding is not configured
   - Database connection fails for any reason

For a more detailed walkthrough, see the [Hyperdrive documentation](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-postgres/).

### More on Docker's Use in Local Development

When developing locally with Hyperdrive, you **must** use the Docker setup provided. This is because Hyperdrive's local dev mode requires a database running on localhost with the exact configuration specified in `localConnectionString`.

The Docker setup in this template ensures the PostgreSQL instance is properly configured to work with Hyperdrive locally. The container automatically runs `init.sql` to create tables and load sample data.

While remote database use in local dev with Hyperdrive is not currently supported, it is being worked on.

## Ways to Deploy

There are two different ways to deploy this application: Full Experience and Demo Mode.

### Option 1: With Database (Full Experience)

1. Run `npm i`
2. Sign up for a PostgreSQL provider and create a database
   - Quickstart options: [Supabase](https://supabase.com/), [Neon](https://neon.tech/)
3. Load the sample data using the provided SQL script:
   - The `/init.sql` file contains all database schema and sample data
   - You can either:
     - Copy and paste the contents into your database provider's SQL editor
     - Or use a command line tool like `psql`: `psql -h hostname -U username -d dbname -f init.sql`
4. Create a Hyperdrive connection by running:
   ```sh
   npx wrangler hyperdrive create <YOUR_CONFIG_NAME> --connection-string="<postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name>"
   ```
5. Uncomment and update the Hyperdrive binding in `wrangler.jsonc` with the ID from step 4:
   ```json
   "hyperdrive": [
     {
       "binding": "HYPERDRIVE",
       "id": "YOUR_HYPERDRIVE_ID",
       "localConnectionString": "postgresql://myuser:mypassword@localhost:5432/mydatabase"
     }
   ]
   ```
6. Deploy with `npm run deploy`

### Option 2: Without Database (Demo Mode)

1. Run `npm i`
2. Keep the Hyperdrive binding commented out in `wrangler.jsonc` (this is the default)
3. Deploy with `npm run deploy`
4. The app will automatically use mock data instead of a real database

## Resources

- [Neon PostgreSQL with Cloudflare Workers and Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/neon/)
- [Cloudflare Vite Plugin](https://www.npmjs.com/package/@cloudflare/vite-plugin)
- [Cloudflare Hyperdrive Documentation](https://developers.cloudflare.com/hyperdrive/get-started/)
- [Hono - Fast, Lightweight, Web Framework for Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Workers Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/)


================================================================================
Content from: README (11).md
================================================================================

# R2-Explorer App

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/r2-explorer-template)

![R2 Explorer Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/e3c4ab7e-43f2-49df-6317-437f4ae8ce00/public)

<!-- dash-content-start -->

R2-Explorer brings a familiar Google Drive-like interface to your Cloudflare R2 storage buckets, making file management simple and intuitive.

## Key Features

- **🔒 Security**
  - Basic Authentication support
  - Cloudflare Access integration
  - Self-hosted on your Cloudflare account

- **📁 File Management**
  - Drag-and-drop file upload
  - Folder creation and organization
  - Multi-part upload for large files
  - Right-click context menu for advanced options
  - HTTP/Custom metadata editing

- **👀 File Handling**
  - In-browser file preview
    - PDF documents
    - Images
    - Text files
    - Markdown
    - CSV
    - Logpush files
  - In-browser file editing
  - Folder upload support

- **📧 Email Integration**
  - Receive and process emails via Cloudflare Email Routing
  - View email attachments directly in the interface

- **🔎 Observability**
  - View real-time logs associated with any deployed Worker using `wrangler tail`
  <!-- dash-content-end -->

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/r2-explorer-template#setup-steps) before deploying.

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```
npm create cloudflare@latest -- --template=cloudflare/templates/r2-explorer-template
```

A live public deployment of this template is available at [https://demo.r2explorer.com](https://demo.r2explorer.com)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [R2 Bucket](https://developers.cloudflare.com/r2/get-started/) with the name "r2-explorer-bucket":
   ```bash
   npx wrangler r2 bucket create r2-explorer-bucket
   ```
3. Deploy the project!
   ```bash
   npx wrangler deploy
   ```
4. Monitor your worker
   ```bash
   npx wrangler tail
   ```

## Next steps

By default this template is **readonly**.

in order for you to enable editing, just update the `readonly` flag in your `src/index.ts` file.

Its highly recommended that you setup security first, [learn more here](https://r2explorer.com/getting-started/security/).


================================================================================
Content from: README (12).md
================================================================================

# Worker + PostgreSQL using Hyperdrive

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/postgres-hyperdrive-template)

<!-- dash-content-start -->

[Hyperdrive](https://developers.cloudflare.com/hyperdrive/) makes connecting to your regional SQL database from Cloudflare Workers fast by:

- Pooling database connections globally 🌎
- Eliminating roundtrips with edge connection setup 🔗
- Caching query results for speed and scale (optional) ⚡️

Check out the [demo](https://hyperdrive-demo.pages.dev/) to see how Hyperdrive can provide up to 4x faster queries. Learn more about [how Hyperdrive works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/) to speed up your database access.

This project demonstrates a Worker connecting to a PostgreSQL database using Hyperdrive. Upon loading your Worker, your will see an administrative dashboard that showcases simple
create, read, update, delete commands to your PostgreSQL database with Hyperdrive.

> [!IMPORTANT]
> When creating a Hyperdrive configuration as part of this template, disable caching from your Hyperdrive configuration to ensure your administrative shows updated values. Learn more about [Hyperdrive's built-in query caching](https://developers.cloudflare.com/hyperdrive/configuration/query-caching/) and when to use it.
>
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/hyperdrive-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```
npm create cloudflare@latest -- --template=cloudflare/templates/postgres-hyperdrive-template
```

A live public deployment of this template is available at [https://postgres-hyperdrive-template.templates.workers.dev](https://postgres-hyperdrive-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [Hyperdrive configuration](https://developers.cloudflare.com/hyperdrive/get-started/) with the name "hyperdrive-configuration":

   ```bash
   npx wrangler hyperdrive create hyperdrive-configuration --connection-string="postgres://<DB_USER>:<DB_PASSWORD>@<DB_HOSTNAME_OR_IP_ADDRESS>:5432/<DATABASE_NAME>" --caching-disabled
   ```

   ...and update the `hyperdrive` `id` field in `wrangler.json` with the new Hyperdrive ID. You can also specify a connection string for a local PostgreSQL database used for development using the `hyperdrive` `localConnectionString` field.

3. Deploy the project!
   ```bash
   npx wrangler deploy
   ```
4. (Optional) To run your project locally while connecting to your remote database, you must use `wrangler dev --remote` which will run your Worker in Cloudflare's environment so that you can access your remote database. Run the following:
   ```bash
   npx wrangler dev --remote
   ```
5. Monitor your worker
   ```bash
   npx wrangler tail
   ```


================================================================================
Content from: README (13).md
================================================================================

# OpenAuth Server

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/openauth-template)

![OpenAuth Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/b2ff10c6-8f7c-419f-8757-e2ccf1c84500/public)

<!-- dash-content-start -->

[OpenAuth](https://openauth.js.org/) is a universal provider for managing user authentication. By deploying OpenAuth on Cloudflare Workers, you can add scalable authentication to your application. This demo showcases login, user registration, and password reset, with storage and state powered by [D1](https://developers.cloudflare.com/d1/) and [KV](https://developers.cloudflare.com/kv/). [Observability](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#enable-workers-logs) is on by default.

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/openauth-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/openauth-template
```

A live public deployment of this template is available at [https://openauth-template.templates.workers.dev](https://openauth-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [D1 database](https://developers.cloudflare.com/d1/get-started/) with the name "openauth-template-auth-db":
   ```bash
   npx wrangler d1 create openauth-template-auth-db
   ```
   ...and update the `database_id` field in `wrangler.json` with the new database ID.
3. Run the following db migration to initialize the database (notice the `migrations` directory in this project):
   ```bash
   npx wrangler d1 migrations apply --remote openauth-template-auth-db
   ```
4. Create a [kv namespace](https://developers.cloudflare.com/kv/get-started/) with a binding named "AUTH_STORAGE":
   ```bash
   npx wrangler kv namespace create AUTH_STORAGE
   ```
   ...and update the `kv_namespaces` -> `id` field in `wrangler.json` with the new namespace ID.
5. Deploy the project!
   ```bash
   npx wrangler deploy
   ```
6. And monitor your worker
   ```bash
   npx wrangler tail
   ```


================================================================================
Content from: README (14).md
================================================================================

# Node.js HTTP Server Template for Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/nodejs-http-server-template)

<!-- dash-content-start -->

A simple Node.js HTTP server template using the built-in `node:http` module, designed to run on Cloudflare Workers.

<!-- dash-content-end -->

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run locally:**

   ```bash
   npm run dev
   ```

3. **Deploy to Cloudflare Workers:**
   ```bash
   npx wrangler deploy
   ```

## Usage

The template creates a basic HTTP server:

```javascript
import { createServer } from "node:http";
import { httpServerHandler } from "cloudflare:node";

const server = createServer((req, res) => {
	res.writeHead(200, { "Content-Type": "text/plain" });
	res.end("Hello from Node.js HTTP server!");
});

server.listen(8080);
export default httpServerHandler({ port: 8080 });
```

## Configuration

The `wrangler.toml` includes the necessary compatibility flags:

```toml
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2025-09-03"
```

## Scripts

- `npm start` - Start the server
- `npm run dev` - Start with hot reload
- `npm test` - Run tests

## Learn More

- [Cloudflare Workers Node.js HTTP Documentation](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/)
- [Node.js HTTP Module](https://nodejs.org/api/http.html)

## License

MIT


================================================================================
Content from: README (15).md
================================================================================

# NLWeb Starter

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/nlweb-template)

<!-- dash-content-start -->

This is a [NLWeb](https://github.com/nlweb-ai/NLWeb) starter template.

It demonstrates basic NLWeb configuration usage with AutoRag and Workers AI

<!-- dash-content-end -->

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/nlweb-template
```

## Getting Started

First, run:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then run the development server (using the package manager of your choice):

```bash
npm run dev
```

Open [http://localhost:8787](http://localhost:8787) with your browser to see the result.

You can start editing your Worker by modifying `src/index.ts`.

## Deploying To Production

| Command          | Action                                |
| :--------------- | :------------------------------------ |
| `npm run deploy` | Deploy your application to Cloudflare |

## Learn More

To learn more about NLWeb, take a look at the following resources:

- [NLWeb Repo](https://github.com/nlweb-ai/NLWeb) - learn about NLWeb

Your feedback and contributions are welcome!


================================================================================
Content from: README (16).md
================================================================================

# Next.js Framework Starter

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/next-starter-template)

<!-- dash-content-start -->

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). It's deployed on Cloudflare Workers as a [static website](https://developers.cloudflare.com/workers/static-assets/).

This template uses [OpenNext](https://opennext.js.org/) via the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare), which works by taking the Next.js build output and transforming it, so that it can run in Cloudflare Workers.

<!-- dash-content-end -->

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/next-starter-template
```

A live public deployment of this template is available at [https://next-starter-template.templates.workers.dev](https://next-starter-template.templates.workers.dev)

## Getting Started

First, run:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then run the development server (using the package manager of your choice):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Deploying To Production

| Command                           | Action                                       |
| :-------------------------------- | :------------------------------------------- |
| `npm run build`                   | Build your production site                   |
| `npm run preview`                 | Preview your build locally, before deploying |
| `npm run build && npm run deploy` | Deploy your production site to Cloudflare    |
| `npm wrangler tail`               | View real-time logs for all Workers          |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!


================================================================================
Content from: README (17).md
================================================================================

# Worker + MySQL using Hyperdrive

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/mysql-hyperdrive-template)

<!-- dash-content-start -->

[Hyperdrive](https://developers.cloudflare.com/hyperdrive/) makes connecting to your regional SQL database from Cloudflare Workers fast by:

- Pooling database connections globally 🌎
- Eliminating roundtrips with edge connection setup 🔗
- Caching query results for speed and scale (optional) ⚡️

Check out the [demo](https://hyperdrive-demo.pages.dev/) to see how Hyperdrive can provide up to 4x faster queries. Learn more about [how Hyperdrive works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/) to speed up your database access.

This project demonstrates a Worker connecting to a MySQL database using Hyperdrive. Upon loading your Worker, your will see an administrative dashboard that showcases simple
create, read, update, delete commands to your MySQL database with Hyperdrive.

> [!IMPORTANT]
> When creating a Hyperdrive configuration as part of this template, disable caching from your Hyperdrive configuration to ensure your administrative shows updated values. Learn more about [Hyperdrive's built-in query caching](https://developers.cloudflare.com/hyperdrive/configuration/query-caching/) and when to use it.
>
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/hyperdrive-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```
npm create cloudflare@latest -- --template=cloudflare/templates/mysql-hyperdrive-template
```

A live public deployment of this template is available at [https://mysql-hyperdrive-template.templates.workers.dev](https://mysql-hyperdrive-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [Hyperdrive configuration](https://developers.cloudflare.com/hyperdrive/get-started/) with the name "hyperdrive-configuration":

   ```bash
   npx wrangler hyperdrive create hyperdrive-configuration --connection-string="mysql://<DB_USER>:<DB_PASSWORD>@<DB_HOSTNAME_OR_IP_ADDRESS>:3306/<DATABASE_NAME>" --caching-disabled
   ```

   ...and update the `hyperdrive` `id` field in `wrangler.json` with the new Hyperdrive ID. You can also specify a connection string for a local MySQL database used for development using the `hyperdrive` `localConnectionString` field.

3. Deploy the project!
   ```bash
   npx wrangler deploy
   ```
4. (Optional) To run your project locally while connecting to your remote database, you must use `wrangler dev --remote` which will run your Worker in Cloudflare's environment so that you can access your remote database. Run the following:
   ```bash
   npx wrangler dev --remote
   ```
5. Monitor your worker
   ```bash
   npx wrangler tail
   ```


================================================================================
Content from: README (18).md
================================================================================

# Multiplayer Globe App

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/multiplayer-globe-template)

![Multiplayer Globe Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/43100bd9-8e11-4c20-cc00-3bec86253f00/public)

<!-- dash-content-start -->

Using the power of [Durable Objects](https://developers.cloudflare.com/durable-objects/), this example shows website visitor locations in real-time. Anyone around the world visiting the [demo website](https://multiplayer-globe-template.templates.workers.dev) will be displayed as a dot on the globe! This template is powered by [PartyKit](https://www.partykit.io/).

## How It Works

Each time someone visits the page, a WebSocket connection is opened with a Durable Object that manages the state of the globe. Visitors are placed on the globe based on the geographic location of their IP address, which is exposed as a [property on the initial HTTP request](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) that establishes the WebSocket connection.

The Durable Object instance that manages the state of the globe runs in one location, and handles all incoming WebSocket connections. When a new connection is established, the Durable Object broadcasts the location of the new visitor to all other active visitors, and the client adds the new visitor to the globe visualization. When someone leaves the page and their connection is closed, the Durable Object similarly broadcasts their removal. The Durable Object instance remains active as long as there is at least one open connection. If all open connections are closed, the Durable Object instance is purged from memory and remains inactive until a new visitor lands on the page, opens a connection, and restarts the lifecycle.

## More on Durable Objects

In this template, only one Durable Object instance is created, since all visitors should see updates from all other visitors, everywhere in the world. A more complex version of this application could instead show a map of the country the visitor is located in, and only display markers for other visitors who are located in the same country. In this case, a Durable Object instance would be created for each country, and the client would connect to and receive updates from the Durable Object instance corresponding to the visitor's country.

For this example, Durable Objects are used for synchronizing but not storing state. Since visitor connections are ephemeral, and tied to the in-memory lifespan of the Durable Object instance, there's no need to use persistent storage. However, a more complex version of this application could display the all-time visitor count, which needs to be persisted beyond the in-memory lifespan of the Durable Object. In this case, the Durable Object code would use the [Durable Object Storage API](https://developers.cloudflare.com/durable-objects/api/storage-api/) to persist the value of the counter.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```
npm create cloudflare@latest -- --template=cloudflare/templates/multiplayer-globe-template
```

A live public deployment of this template is available at [https://multiplayer-globe-template.templates.workers.dev](https://multiplayer-globe-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Deploy the project
   ```bash
   npx wrangler deploy
   ```
3. And monitor your workers!
   ```bash
   npx wrangler tail
   ```


================================================================================
Content from: README (19).md
================================================================================

# LLM Chat Application Template

A simple, ready-to-deploy chat application template powered by Cloudflare Workers AI. This template provides a clean starting point for building AI chat applications with streaming responses.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/llm-chat-app-template)

<!-- dash-content-start -->

## Demo

This template demonstrates how to build an AI-powered chat interface using Cloudflare Workers AI with streaming responses. It features:

- Real-time streaming of AI responses using Server-Sent Events (SSE)
- Easy customization of models and system prompts
- Support for AI Gateway integration
- Clean, responsive UI that works on mobile and desktop

## Features

- 💬 Simple and responsive chat interface
- ⚡ Server-Sent Events (SSE) for streaming responses
- 🧠 Powered by Cloudflare Workers AI LLMs
- 🛠️ Built with TypeScript and Cloudflare Workers
- 📱 Mobile-friendly design
- 🔄 Maintains chat history on the client
- 🔎 Built-in Observability logging
<!-- dash-content-end -->

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Cloudflare account with Workers AI access

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/cloudflare/templates.git
   cd templates/llm-chat-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Generate Worker type definitions:
   ```bash
   npm run cf-typegen
   ```

### Development

Start a local development server:

```bash
npm run dev
```

This will start a local server at http://localhost:8787.

Note: Using Workers AI accesses your Cloudflare account even during local development, which will incur usage charges.

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

### Monitor

View real-time logs associated with any deployed Worker:

```bash
npm wrangler tail
```

## Project Structure

```
/
├── public/             # Static assets
│   ├── index.html      # Chat UI HTML
│   └── chat.js         # Chat UI frontend script
├── src/
│   ├── index.ts        # Main Worker entry point
│   └── types.ts        # TypeScript type definitions
├── test/               # Test files
├── wrangler.jsonc      # Cloudflare Worker configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This documentation
```

## How It Works

### Backend

The backend is built with Cloudflare Workers and uses the Workers AI platform to generate responses. The main components are:

1. **API Endpoint** (`/api/chat`): Accepts POST requests with chat messages and streams responses
2. **Streaming**: Uses Server-Sent Events (SSE) for real-time streaming of AI responses
3. **Workers AI Binding**: Connects to Cloudflare's AI service via the Workers AI binding

### Frontend

The frontend is a simple HTML/CSS/JavaScript application that:

1. Presents a chat interface
2. Sends user messages to the API
3. Processes streaming responses in real-time
4. Maintains chat history on the client side

## Customization

### Changing the Model

To use a different AI model, update the `MODEL_ID` constant in `src/index.ts`. You can find available models in the [Cloudflare Workers AI documentation](https://developers.cloudflare.com/workers-ai/models/).

### Using AI Gateway

The template includes commented code for AI Gateway integration, which provides additional capabilities like rate limiting, caching, and analytics.

To enable AI Gateway:

1. [Create an AI Gateway](https://dash.cloudflare.com/?to=/:account/ai/ai-gateway) in your Cloudflare dashboard
2. Uncomment the gateway configuration in `src/index.ts`
3. Replace `YOUR_GATEWAY_ID` with your actual AI Gateway ID
4. Configure other gateway options as needed:
   - `skipCache`: Set to `true` to bypass gateway caching
   - `cacheTtl`: Set the cache time-to-live in seconds

Learn more about [AI Gateway](https://developers.cloudflare.com/ai-gateway/).

### Modifying the System Prompt

The default system prompt can be changed by updating the `SYSTEM_PROMPT` constant in `src/index.ts`.

### Styling

The UI styling is contained in the `<style>` section of `public/index.html`. You can modify the CSS variables at the top to quickly change the color scheme.

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)


================================================================================
Content from: README (20).md
================================================================================

# Durable Objects Starter

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/hello-world-do-template)

<!-- dash-content-start -->

This is a [Durable Object](https://developers.cloudflare.com/durable-objects/) starter template. It comes with a `sayHello` method that returns `Hello World!`.

<!-- dash-content-end -->

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/hello-world-do-template
```

## Getting Started

First, run:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then run the development server (using the package manager of your choice):

```bash
npm run dev
```

Open [http://localhost:8787](http://localhost:8787) with your browser to see the result.

You can start editing the project by modifying `src/index.ts`.

## Deploying To Production

| Command             | Action                                |
| :------------------ | :------------------------------------ |
| `npm run deploy`    | Deploy your application to Cloudflare |
| `npm wrangler tail` | View real-time logs for all Workers   |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Durable Objects](https://developers.cloudflare.com/durable-objects/) - learn about Durable Objects

Your feedback and contributions are welcome!


================================================================================
Content from: README (21).md
================================================================================

# Durable Chat App

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/durable-chat-template)

![Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/da00d330-9a3b-40a2-e6df-b08813fb7200/public)

<!-- dash-content-start -->

With this template, you can deploy your own chat app to converse with other users in real-time. Going to the [demo website](https://durable-chat-template.templates.workers.dev) puts you into a unique chat room based on the ID in the url. Share that ID with others to chat with them! This is powered by [Durable Objects](https://developers.cloudflare.com/durable-objects/) and [PartyKit](https://www.partykit.io/).

## How It Works

Users are assigned their own chat room when they first visit the page, and can talk to others by sharing their room URL. When someone joins the chat room, a WebSocket connection is opened with a [Durable Object](https://developers.cloudflare.com/durable-objects/) that stores and synchronizes the chat history.

The Durable Object instance that manages the chat room runs in one location, and handles all incoming WebSocket connections. Chat messages are stored and retrieved using the [Durable Object SQL Storage API](https://developers.cloudflare.com/durable-objects/api/sql-storage/). When a new user joins the room, the existing chat history is retrieved from the Durable Object for that room. When a user sends a chat message, the message is stored in the Durable Object for that room and broadcast to all other users in that room via WebSocket connection. This template uses the [PartyKit Server API](https://docs.partykit.io/reference/partyserver-api/) to simplify the connection management logic, but could also be implemented using Durable Objects on their own.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```
npm create cloudflare@latest -- --template=cloudflare/templates/durable-chat-template
```

A live public deployment of this template is available at [https://durable-chat-template.templates.workers.dev](https://durable-chat-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Deploy the project!
   ```bash
   npx wrangler deploy
   ```
3. Monitor your worker
   ```bash
   npx wrangler tail
   ```


================================================================================
Content from: README (22).md
================================================================================

# Worker + D1 Database

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/d1-template)

![Worker + D1 Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/cb7cb0a9-6102-4822-633c-b76b7bb25900/public)

<!-- dash-content-start -->

D1 is Cloudflare's native serverless SQL database ([docs](https://developers.cloudflare.com/d1/)). This project demonstrates using a Worker with a D1 binding to execute a SQL statement. A simple frontend displays the result of this query:

```SQL
SELECT * FROM comments LIMIT 3;
```

The D1 database is initialized with a `comments` table and this data:

```SQL
INSERT INTO comments (author, content)
VALUES
    ('Kristian', 'Congrats!'),
    ('Serena', 'Great job!'),
    ('Max', 'Keep up the good work!')
;
```

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/d1-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```
npm create cloudflare@latest -- --template=cloudflare/templates/d1-template
```

A live public deployment of this template is available at [https://d1-template.templates.workers.dev](https://d1-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [D1 database](https://developers.cloudflare.com/d1/get-started/) with the name "d1-template-database":
   ```bash
   npx wrangler d1 create d1-template-database
   ```
   ...and update the `database_id` field in `wrangler.json` with the new database ID.
3. Run the following db migration to initialize the database (notice the `migrations` directory in this project):
   ```bash
   npx wrangler d1 migrations apply --remote d1-template-database
   ```
4. Deploy the project!
   ```bash
   npx wrangler deploy
   ```


================================================================================
Content from: README (23).md
================================================================================

# d1-starter-sessions-api

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/d1-starter-sessions-api-template)

<!-- dash-content-start -->

Starter repository using Cloudflare Workers with D1 database and the new [D1 Sessions API for read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/#use-sessions-api).

## What is the demo?

This demo simulates purchase orders administration.
There are two main actions you can do.

1. Create an order with a `customerId`, `orderId`, and `quantity`.
2. List all orders.

The UI when visiting the deployed Worker project shows 3 buttons.

- **Create order & List**
  - Creates a new order using the provided customer ID with a random order ID and quantity.
  - Does a `POST /api/orders` request to the Worker, and its handler uses the Sessions API to do an `INSERT` first for the new order that will be forwarded to the primary database instance, followed by a `SELECT` query to list all orders that will be executed by nearest replica database.
- **List orders**
  - Lists every order recorded in the database.
  - Does a `GET /api/orders` request to the Worker, and its handler uses the Sessions API to do a `SELECT` query to list the orders that will be executed by the nearest replica database.
- **Reset**
  - Drops and recreates the orders table.
  - Gets executed by the primary database.

The UI JavaScript code maintains the latest `bookmark` returned by the API and sends it along every subsequent request.
This ensures that we have sequential consistency in our observed database results and all our actions are properly ordered.

Read more information about how the Sessions API works, and how sequential consistency is achieved in the [D1 read replication documentation](https://developers.cloudflare.com/d1/best-practices/read-replication/).

<!-- dash-content-end -->

## Deploy

1. Checkout the project locally.
2. Run `npm ci` to install all dependencies.
3. Run `npm run deploy` to deploy to your Cloudflare account.
4. Visit the URL you got in step 3.

## Local development

1. Run `npm run dev` to start the development server.
2. Visit <http://localhost:8787>.

Note: The "Served by Region" information won't be shown when running locally.


================================================================================
Content from: README (24).md
================================================================================

# Containers Starter

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/containers-template)

![Containers Template Preview](https://imagedelivery.net/_yJ02hpOMj_EnGvsU2aygw/5aba1fb7-b937-46fd-fa67-138221082200/public)

<!-- dash-content-start -->

This is a [Container](https://developers.cloudflare.com/containers/) starter template.

It demonstrates basic Container configuration, launching and routing to individual container, load balancing over multiple container, running basic hooks on container status changes.

<!-- dash-content-end -->

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/containers-template
```

## Getting Started

First, run:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then run the development server (using the package manager of your choice):

```bash
npm run dev
```

Open [http://localhost:8787](http://localhost:8787) with your browser to see the result.

You can start editing your Worker by modifying `src/index.ts` and you can start
editing your Container by editing the content of `container_src`.

## Deploying To Production

| Command          | Action                                |
| :--------------- | :------------------------------------ |
| `npm run deploy` | Deploy your application to Cloudflare |

## Learn More

To learn more about Containers, take a look at the following resources:

- [Container Documentation](https://developers.cloudflare.com/containers/) - learn about Containers
- [Container Class](https://github.com/cloudflare/containers) - learn about the Container helper class

Your feedback and contributions are welcome!


================================================================================
Content from: README (25).md
================================================================================

# Templates CLI

A handy CLI for developing templates.

## Upload

The `upload` command uploads template contents to the Cloudflare Templates API for consumption by the Cloudflare dashboard and other template clients. This command runs in CI on merges to the `main` branch.

```
$ npx tsx src/index.ts help upload
Usage: cli upload [options] [path-to-templates]

upload templates to the templates API

Arguments:
  path-to-templates  path to directory containing templates (default: ".")
```

## Lint

The `lint` command finds and fixes template style problems that aren't covered by Prettier or ESList. This linter focuses on Cloudflare-specific configuration and project structure.

```
$ npx tsx src/index.ts help lint
Usage: cli lint [options] [path-to-templates]

find and fix template style problems

Arguments:
  path-to-templates  path to directory containing templates (default: ".")

Options:
  --fix              fix problems that can be automatically fixed
```


================================================================================
Content from: README (26).md
================================================================================

# OpenAPI Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/chanfana-openapi-template)

![OpenAPI Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/91076b39-1f5b-46f6-7f14-536a6f183000/public)

<!-- dash-content-start -->

This is a Cloudflare Worker with OpenAPI 3.1 Auto Generation and Validation using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This is an example project made to be used as a quick start into building OpenAPI compliant Workers that generates the
`openapi.json` schema automatically from code and validates the incoming request to the defined parameters or request body.

This template includes various endpoints, a D1 database, and integration tests using [Vitest](https://vitest.dev/) as examples. In endpoints, you will find [chanfana D1 AutoEndpoints](https://chanfana.com/endpoints/auto/d1) and a [normal endpoint](https://chanfana.com/endpoints/defining-endpoints) to serve as examples for your projects.

Besides being able to see the OpenAPI schema (openapi.json) in the browser, you can also extract the schema locally no hassle by running this command `npm run schema`.

<!-- dash-content-end -->

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/openapi-template#setup-steps) before deploying.

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/openapi-template
```

A live public deployment of this template is available at [https://openapi-template.templates.workers.dev](https://openapi-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [D1 database](https://developers.cloudflare.com/d1/get-started/) with the name "openapi-template-db":
   ```bash
   npx wrangler d1 create openapi-template-db
   ```
   ...and update the `database_id` field in `wrangler.json` with the new database ID.
3. Run the following db migration to initialize the database (notice the `migrations` directory in this project):
   ```bash
   npx wrangler d1 migrations apply DB --remote
   ```
4. Deploy the project!
   ```bash
   npx wrangler deploy
   ```
5. Monitor your worker
   ```bash
   npx wrangler tail
   ```

## Testing

This template includes integration tests using [Vitest](https://vitest.dev/). To run the tests locally:

```bash
npm run test
```

Test files are located in the `tests/` directory, with examples demonstrating how to test your endpoints and database interactions.

## Project structure

1. Your main router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.
3. Integration tests are located in the `tests/` directory.
4. For more information read the [chanfana documentation](https://chanfana.com/), [Hono documentation](https://hono.dev/docs), and [Vitest documentation](https://vitest.dev/guide/).


================================================================================
Content from: README (27).md
================================================================================

# Astro Starter Kit: Blog

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/astro-blog-starter-template)

![Astro Template Preview](https://github.com/withastro/astro/assets/2244813/ff10799f-a816-4703-b967-c78997e8323d)

<!-- dash-content-start -->

Create a blog with Astro and deploy it on Cloudflare Workers as a [static website](https://developers.cloudflare.com/workers/static-assets/).

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support
- ✅ Built-in Observability logging

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/astro-blog-starter-template
```

A live public deployment of this template is available at [https://astro-blog-starter-template.templates.workers.dev](https://astro-blog-starter-template.templates.workers.dev)

## 🚀 Project Structure

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                           | Action                                           |
| :-------------------------------- | :----------------------------------------------- |
| `npm install`                     | Installs dependencies                            |
| `npm run dev`                     | Starts local dev server at `localhost:4321`      |
| `npm run build`                   | Build your production site to `./dist/`          |
| `npm run preview`                 | Preview your build locally, before deploying     |
| `npm run astro ...`               | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help`         | Get help using the Astro CLI                     |
| `npm run build && npm run deploy` | Deploy your production site to Cloudflare        |
| `npm wrangler tail`               | View real-time logs for all Workers              |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).


================================================================================
Content from: README (28).md
================================================================================

# Templates for Cloudflare Workers

Cloudflare Workers let you deploy serverless code instantly across the globe for exceptional performance, reliability, and scale. This repository contains a collection of starter templates for building full-stack applications on Workers. **You are encouraged to use, modify, and extend this code!**

## Getting Started

There are two ways to start building with a template in this repository: the [Cloudflare dashboard](https://dash.cloudflare.com/) and [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI).

### Starting from the Dashboard

After logging in or signing up through the [Cloudflare dashboard](https://dash.cloudflare.com/), open the [Workers templates page](https://dash.cloudflare.com/?to=/:account/workers-and-pages/templates) and select a template to get started with. From here, you can create a repository and deploy your first Worker without needing a local development environment.

### Starting via CLI

To get started locally, run one of the following commands:

```bash
npm create cloudflare@latest
# or
pnpm create cloudflare@latest
# or
yarn create cloudflare@latest
```

For more information on getting started with our CLI, check out the [getting started guide](https://developers.cloudflare.com/workers/get-started/guide/).

### Additional Resources

Questions about Workers? Join the [official Cloudflare Discord](https://workers.community/) or check out the [Workers docs](https://developers.cloudflare.com/workers/)!

## End-to-End Testing

This repository includes a comprehensive Playwright-based E2E test suite that validates all templates to ensure they work correctly. The test system supports both **local development mode** (spinning up dev servers) and **live mode** (testing against deployed templates).

### Running E2E Tests

#### Local Development Mode (Default)

By default, tests run against locally started development servers:

```bash
# Run all E2E tests
pnpm run test:e2e

# Run tests for specific templates
pnpm run test:e2e astro-blog-starter-template.spec.ts
pnpm run test:e2e saas-admin-template.spec.ts

# Run tests with UI mode for debugging
pnpm run test:e2e --ui
```

In local mode:

- Tests start development servers automatically for each template
- Uses one worker to prevent port conflicts
- Servers are properly cleaned up between different template tests
- Longer timeouts to account for build and startup time

#### Live Mode (Testing Deployed Templates)

To test against live deployed templates, set the `PLAYWRIGHT_USE_LIVE` environment variable:

```bash
# Run tests against live deployed templates
pnpm run test:e2e:live

# Run specific template tests in live mode
pnpm run test:e2e:live saas-admin-template.spec.ts
```

In live mode:

- Tests run against `https://{template-name}.templates.workers.dev`
- Enables parallel execution (up to 4 workers locally, 2 in CI)
- Faster execution since no local server startup required
- Shorter timeouts since templates are already running

### Test Architecture

The test system includes:

- **Automatic template discovery**: Finds all `*-template` directories and analyzes their framework
- **Smart server management**: Detects framework type (Astro, Next.js, Vite, etc.) and uses appropriate ports
- **Reliable cleanup**: Properly terminates process trees between test runs
- **Flexible URL resolution**: Automatically determines live URLs from `wrangler.json` configuration

### Writing Template Tests

Template tests should be named `{template-name}.spec.ts` and placed in the `playwright-tests/` directory:

```typescript
import { test, expect } from "./fixtures";

test.describe("My Template", () => {
	test("should render correctly", async ({ page, templateUrl }) => {
		await page.goto(templateUrl);
		await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
	});
});
```

The `templateUrl` fixture automatically provides the correct URL (local dev server or live deployment) based on the test mode.

#### Playwright Codegen

Playwright includes a test code generation utility that records your actions in a chromium browswer. To start the codegen utility run

```bash
pnpm playwright codgen
```

## Contributing

We welcome template contributions! If there's a Workers template you think would be valuable, please read our [contributing guide](./CONTRIBUTING.md) and open an issue or pull request.
