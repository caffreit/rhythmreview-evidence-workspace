# Technology and repository guide

Status: implementation reference

Snapshot: 13 September 2026

## Runtime stack

| Area | Technology | Use in this repository |
| --- | --- | --- |
| Language | TypeScript 5.9 | Application, domain types, API routes, database access, and tests |
| UI | React 19 and TSX | Single-page evidence workspace and guided walkthrough |
| Application API | Next.js App Router conventions | Thirty route handlers under `app/api` |
| Build and server runtime | Vinext 1, Vite 8, and the Cloudflare Vite plugin | Builds the Next-style application for a Cloudflare Worker |
| Hosting | OpenAI Sites configuration on Cloudflare | Injects the `DB` binding and builds the deployable worker assets |
| Database | Cloudflare D1, SQLite dialect | Stores all controlled, working, model-run, audit, and fixture records |
| Schema tools | Drizzle ORM and Drizzle Kit | Defines tables and generates migrations |
| Runtime validation | Zod 4 | Parses inputs, model output, database rows, and client responses |
| Model client | OpenAI JavaScript SDK | Calls OpenRouter's Responses and embeddings endpoints |
| Styles | CSS and Tailwind PostCSS plugin | `app/globals.css` contains the application styles |
| Tests | Vitest plus executable verification scripts | Unit tests, workflow checks, live smoke tests, and corpus evaluation |
| Static analysis | TypeScript and ESLint | Compile-time and lint checks |

## Languages and file formats

TypeScript is the product language. TSX adds the React view layer. SQL migrations define the persistent schema. JavaScript ES modules under `scripts/` generate seed data, embed migrations, and run verification flows. One Python script generates the walkthrough PDF. JSON stores seed data and configuration. Markdown contains product, evaluation, and presentation records.

The application stores several structured fields as JSON text in D1. Examples include jurisdictions, source citations, candidate parents, audit details, model inputs and outputs, and embedding vectors. Zod schemas provide the runtime shape checks that SQLite cannot provide for those fields.

## Repository map

| Path | Owner and purpose |
| --- | --- |
| `app/` | Page entry point, global styles, and HTTP route handlers |
| `components/` | Browser UI, role simulation, walkthrough, audit, and coherence views |
| `lib/domain.ts` | Change-first domain values and HTTP command schemas |
| `lib/source-domain.ts` | Source-first domain values and command schemas |
| `lib/repository.ts` | Evidence, change, baseline, document, audit, evaluation, and coherence persistence |
| `lib/source-repository.ts` | Source import, processing, review, impact, baseline, and release persistence |
| `lib/analysis.ts` | Graph traversal, lexical retrieval, cosine similarity, and candidate merging |
| `lib/openrouter-provider.ts` | Semantic retrieval and bounded impact classification |
| `lib/source-ai.ts` | Context, user-need, and requirement model calls |
| `lib/source-analysis-policies.ts` | Versioned prompt text and structured-output schemas |
| `lib/coherence.ts` | Deterministic rules and explicit evaluation fixtures |
| `db/schema.ts` | Authoritative Drizzle table definitions |
| `db/runtime-schema.ts` | Generated migration statements applied by the Worker |
| `drizzle/` | Generated SQL migrations and schema snapshots |
| `lib/data/seed.json` | Generated 72-item fictional baseline and replay corpus |
| `scripts/` | Seed generation, migration embedding, verification, evaluation, and PDF generation |
| `tests/` | Domain and source-workflow unit tests |
| `docs/` | Product decisions, technical references, evaluation evidence, and demo material |

## Request and validation pattern

The browser calls a route under `app/api`. The route parses the request body or passes it to a repository function. Repository functions validate commands with Zod, issue prepared D1 statements, and parse stored rows back into domain objects. The browser parses the returned object with another Zod schema.

This creates validation at both network ends. It does not replace database referential integrity. See [Data model and database](data-model.md) for the gap.

## Build and verification commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vinext application |
| `npm test` | Run Vitest tests |
| `npx tsc --noEmit` | Type-check the repository |
| `npm run lint` | Run ESLint outside generated build folders |
| `npm run verify:demo` | Exercise the three saved change scenarios |
| `npm run verify:source` | Exercise the source workflow with live AI unavailable and explicit replay |
| `npm run build` | Build the Cloudflare deployment artifacts |
| `npm run verify:live` | Make opt-in paid OpenRouter smoke calls using fictional data |
| `npm run evaluate:live-corpus` | Evaluate live impact runs against the provisional fixture answer key |
| `npm run seed:generate` | Regenerate the controlled seed JSON |
| `npm run db:generate` | Generate a Drizzle migration after a schema change |
| `npm run db:embed` | Rebuild the runtime migration statement list |

Live commands require `.env.local` with an OpenRouter key. Ordinary tests and replay workflows do not require the key.

## Architectural consequences

The stack is small enough for a prototype team to inspect end to end. Zod gives the model boundary a strong contract, and D1 keeps deployment simple. The trade-off is concentration: two repository files own most workflow and persistence behavior, runtime migration happens during a request, and application code enforces relationships that the database does not.

Before a multi-user pilot, split workflow commands from query code, introduce authenticated authorization, add database foreign keys, and make baseline approval one recoverable atomic operation. Long model calls also need a durable job boundary instead of an HTTP request lifecycle.
