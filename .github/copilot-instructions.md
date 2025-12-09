# AI Coding Agent Instructions for create-t3-turbo

## Monorepo Architecture

This is a **Turborepo-based monorepo** with three distinct app layers and shared backend packages:

- **Apps** (`apps/nextjs`, `apps/expo`, `apps/tanstack-start`): Front-end applications consuming shared APIs
- **Packages** (`@acme/*`): Shared business logic and utilities
  - `@acme/api`: tRPC v11 router (defines all backend endpoints)
  - `@acme/auth`: Better Auth integration (handles authentication across all apps)
  - `@acme/db`: Drizzle ORM + Supabase schema definitions
  - `@acme/ui`: shadcn-ui component library with Tailwind v4
  - `@acme/validators`: Zod schema validation
- **Tooling** (`tooling/`): Shared ESLint, Prettier, Tailwind, TypeScript configs

## Critical Build & Dev Commands

Use **Turbo** for all workspace operations (not individual `pnpm` in subdirectories):

```bash
pnpm dev                 # Start all apps with watch mode (same session)
pnpm dev:next          # Start only Next.js app + dependencies
pnpm build             # Build all packages and apps (respects dependency graph)
pnpm lint              # Lint all packages (depends on ^topo then ^build)
pnpm typecheck         # Type-check all packages
pnpm db:push           # Push Drizzle schema to Supabase
pnpm db:studio         # Open Drizzle Studio
pnpm format:fix        # Auto-format all files with Prettier
```

**Key point**: `turbo run` respects task dependencies defined in `turbo.json`. Never skip to `pnpm` in subdirectories—Turbo's task graph handles parallelization and caching.

## Data Flow & Type Safety

### tRPC End-to-End Typing

All API communication is **type-safe through tRPC**:

1. **Server definition** (`packages/api/src/router/`): Define routers with Zod validation
   ```typescript
   export const postRouter = createTRPCRouter({
     all: publicProcedure.query(async ({ ctx }) => db.query.Post.findMany()),
   });
   ```

2. **Type inference** (`packages/api/src/index.ts`): Export `RouterInputs` and `RouterOutputs` for type-safe client calls
3. **Client consumption**:
   - **RSC** (Next.js `server.tsx`): `const trpc = createTRPCOptionsProxy<AppRouter>`—calls routers directly with server context
   - **Client** (Next.js `react.tsx`, Expo): HTTP batch stream link via `httpBatchStreamLink` to API routes

### Database Schema

- **Drizzle ORM** defines schema in `packages/db/src/schema.ts` (uses `drizzle-zod` for automatic Zod schemas)
- **Better Auth** auto-generates auth tables via `packages/db/src/auth-schema.ts`
- **Edge-bound**: Uses Vercel Postgres driver (``:6543`` connection pooling)
- Push changes: `pnpm db:push` (uses `packages/db/drizzle.config.ts`)

## Authentication Architecture

**Better Auth** handles OAuth and sessions across all platforms:

- Initialized in `packages/auth/src/index.ts` with Discord OAuth + Expo support
- **Discord redirects**: Production URL in OAuth config must match deployment domain
- **Server-side**: Next.js calls `auth.api.getSession()` in RSC context via headers
- **Client-side**: React components use `useTRPC` for session queries

## Environment & Validation

- **Strict env access**: All environment variables validated through `env.ts` files in each app
- ESLint rule `restrictEnvAccess` forbids direct `process.env` access—must import from `~/env`
- Pattern: `export const env = createEnv({ ... })` with Zod validation in each app

## Package Patterns & Imports

### UI Components (`@acme/ui`)

- Built with shadcn-ui + Tailwind v4
- Use `cn()` utility (in `index.ts`) for class merging: `cn("bg-red", className)`
- Re-exported from `index.ts`—import as `import { Button } from "@acme/ui"`

### Cross-Package Imports

- Use **workspace protocol**: `import { db } from "@acme/db/client"`
- `next.config.js` has `transpilePackages` configured for hot reload during dev
- Circular dependencies are **forbidden**—data flows one direction: `ui/validators` → `db/auth/api` → `apps`

## ESLint & Tooling

- **Shared config** (`tooling/eslint/`): `baseConfig`, `restrictEnvAccess`, platform-specific (nextjs.ts, react.ts)
- Each app/package has `eslint.config.ts` that extends base
- **Prettier**: Configured at root, uses `@ianvs/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`
- **TypeScript**: Extends from `tooling/typescript/base.json`

## Key Integration Points

1. **Adding a new tRPC endpoint**:
   - Define in `packages/api/src/router/`
   - Extend `appRouter` in `packages/api/src/root.ts`
   - Types automatically propagate to clients via `AppRouter` type

2. **Adding a database table**:
   - Add to `packages/db/src/schema.ts`
   - Run `pnpm db:push`
   - Use Drizzle query builder in tRPC procedures

3. **Adding a UI component**:
   - Create in `packages/ui/src/`
   - Export from `packages/ui/src/index.ts`
   - Use in apps with `import { Component } from "@acme/ui"`

4. **Cross-app auth**: All apps use same Better Auth instance—session state is shared

## Important Constraints

- **No hardcoded URLs**: Use environment variables and `env.ts` files
- **React 19 + Server Components**: Next.js app uses RSC for data fetching; Expo uses client-side queries
- **Tailwind v4**: Must use `@tailwindcss/postcss` (not v3)
- **Node 22+**: Minimum version in `package.json` engines
