# AI Coding Agent Instructions

## Monorepo Architecture

This is a **Turborepo-based monorepo** with three distinct app layers and shared backend packages:

- **Apps** (`apps/nextjs`, `apps/expo`, `apps/tanstack-start`): Front-end applications consuming shared APIs
- **Packages** (`@ogm/*`): Shared business logic and utilities
  - `@ogm/api`: tRPC v11 router (defines all backend endpoints)
  - `@ogm/auth`: Better Auth integration (handles authentication across all apps)
  - `@ogm/db`: Drizzle ORM + Supabase (Vercel Postgres) schema definitions
  - `@ogm/storage`: Supabase Storage client (file uploads/downloads)
  - `@ogm/ui`: shadcn-ui component library with Tailwind v4
  - `@ogm/validators`: Zod v4 schema validation
- **Tooling** (`tooling/`): Shared Biome (linting/formatting), Tailwind, TypeScript configs

### Domain Model: Multi-Tenant LMS + Social Platform

The app is a **GoHighLevel (GHL) integrated multi-tenant platform** with three core engines:

1. **Community Engine** (`communities`, `members`): Tenants mapped to GHL Locations, with member roles (owner/admin/moderator/member)
2. **Social Engine** (`channels`, `posts`, `comments`, `likes`): Forum-style discussions with GHL tag-based channel access control
3. **LMS Engine** (`courses`, `modules`, `lessons`, `progress`): Course delivery with video hosting and progress tracking

**Critical**: Members belong to communities via `userId` + `communityId`. Access control uses `memberProcedure` and role checks.

## Critical Build & Dev Commands

Use **Turbo** for all workspace operations (not individual `pnpm` in subdirectories):

```bash
pnpm dev                 # Start all apps with watch mode (same session)
pnpm dev:next            # Start only Next.js app + dependencies
pnpm build               # Build all packages and apps (respects dependency graph)
pnpm check               # Lint all packages with Biome (depends on ^topo then ^build)
pnpm format              # Format all files with Biome
pnpm typecheck           # Type-check all packages
pnpm auth:generate       # Generate Better Auth schema (must run before db:push)
pnpm db:push             # Push Drizzle schema to Postgres
pnpm db:studio           # Open Drizzle Studio
pnpm ui-add              # Add shadcn-ui components interactively
```

**Key points**:
- `turbo run` respects task dependencies defined in `turbo.json`. Never skip to `pnpm` in subdirectories—Turbo's task graph handles parallelization and caching.
- **Always run `pnpm auth:generate` before `pnpm db:push`** to ensure Better Auth tables are included in the schema.
- Uses **Biome** (not ESLint/Prettier) for linting and formatting—see `biome.json` at root.

## Data Flow & Type Safety

### tRPC End-to-End Typing

All API communication is **type-safe through tRPC**:

1. **Server definition** (`packages/api/src/router/`): Define routers with Zod v4 validation
   ```typescript
   export const postRouter = createTRPCRouter({
     all: publicProcedure.query(async ({ ctx }) => db.query.Post.findMany()),
   });
   ```

2. **Type inference** (`packages/api/src/index.ts`): Export `RouterInputs` and `RouterOutputs` for type-safe client calls
3. **Client consumption**:
   - **RSC** (Next.js `server.tsx`): `const trpc = createTRPCOptionsProxy<AppRouter>`—calls routers directly with server context
   - **Client** (Next.js `react.tsx`, Expo): HTTP batch stream link via `httpBatchStreamLink` to API routes
   - **TanStack Start** (`lib/trpc.ts`): Similar HTTP batch stream setup for client-side queries

### Database Schema

- **Drizzle ORM** defines schema in `packages/db/src/schema.ts` (uses `drizzle-zod` for automatic Zod v4 schemas)
- **Better Auth** auto-generates auth tables via `packages/db/src/auth-schema.ts` (run `pnpm auth:generate` to regenerate)
- **Edge-bound**: Uses Vercel Postgres driver (`:6543` connection pooling for edge, `:5432` for migrations)
- Push changes: `pnpm db:push` (uses `packages/db/drizzle.config.ts`, automatically switches to non-pooling URL)

## Authentication Architecture

**Better Auth** handles OAuth and sessions across all platforms:

- Initialized in `packages/auth/src/index.ts` with Expo support
- **Server-side**: Next.js calls `auth.api.getSession()` in RSC context via headers
- **Client-side**: React components use `useTRPC` for session queries

## Custom tRPC Procedures & Authorization

Beyond standard tRPC patterns, this codebase has **custom procedures** in `packages/api/src/trpc.ts`:

- `publicProcedure`: No auth required (base)
- `protectedProcedure`: Requires authentication (checks `ctx.session.user`)
- `memberProcedure`: Requires auth + membership in community (requires `input.communityId`, adds `ctx.member`)
- `adminProcedure`: Extends `memberProcedure`, requires owner/admin role
- `moderatorProcedure`: Extends `memberProcedure`, requires moderator/admin/owner role
- `ownerProcedure`: Extends `memberProcedure`, requires owner role

**Pattern**: Multi-tenant endpoints MUST use `memberProcedure` or higher. Input schemas extend `z.object({ communityId: z.string().uuid() })`.

## GoHighLevel (GHL) Integration

**GHL is the identity & CRM backbone**:

- Communities map to GHL Locations via `ghlLocationId`
- Members map to GHL Contacts via `ghlContactId`
- Users can have a global `ghlGlobalUserId` (SSO)
- Channel access controlled by `ghlTags` array on members (synced via webhooks)
- OAuth flow: `ghlRouter.exchangeCode` stores tokens in `communities` table (encrypt `ghlAccessToken` in app logic)
- Webhook handler: `ghlRouter.syncContact` creates/updates users and members

**Integration files**: `packages/api/src/router/ghl.ts`, `packages/db/src/schema.ts` (communities/members tables)

## Environment & Validation

- **Strict env access**: All environment variables validated through `env.ts` files in each app
- Pattern: `export const env = createEnv({ ... })` with Zod v4 validation in each app (from `@t3-oss/env-nextjs` or `@t3-oss/env-core`)
- Apps extend shared environment schemas (e.g., Next.js extends `authEnv()` from `@ogm/auth/env`)
- Must import from `~/env`—direct `process.env` access forbidden except in `env.ts` files

## Package Patterns & Imports

### UI Components (`@ogm/ui`)

- Built with shadcn-ui + Tailwind v4
- Use `cn()` utility (in `index.ts`) for class merging: `cn("bg-red", className)`
- Re-exported from `index.ts`—import as `import { Button } from "@ogm/ui"`
- Add new components: `pnpm ui-add` (uses shadcn CLI interactively)

### Cross-Package Imports

- Use **workspace protocol**: `import { db } from "@ogm/db/client"`
- `next.config.js` has `transpilePackages` configured for hot reload during dev
- Circular dependencies are **forbidden**—data flows one direction: `ui/validators` → `db/auth/api` → `apps`

### Dependency Management

- **pnpm catalog** (`pnpm-workspace.yaml`): Centralized version management for shared deps (tRPC, React Query, Tailwind, Zod, etc.)
- Use `"package": "catalog:"` in `package.json` to reference catalog versions
- React 19 deps use separate `react19` catalog

## Linting & Tooling

- **Biome** (`biome.json`): Single tool for linting + formatting (replaces ESLint + Prettier)
  - Run `pnpm check` to lint (with task dependencies)
  - Run `pnpm format` to format all files
  - Configured with recommended rules + custom overrides:
    - `noExplicitAny`: "warn" (use `biome-ignore` comments when tRPC types are complex)
    - `noUnusedVariables`: "warn"
    - Formatting: 80-char line width, double quotes, trailing commas, semicolons
  - **Suppress warnings**: `// biome-ignore lint/suspicious/noExplicitAny: <reason>`
- **TypeScript**: Extends from `tooling/typescript/base.json`
- **Tailwind**: Shared theme in `tooling/tailwind/theme.css`
- **Sherif**: Runs on `postinstall` to check workspace dependency consistency (`pnpm lint:ws`)

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
   - Run `pnpm ui-add` and select from shadcn-ui catalog
   - Or manually create in `packages/ui/src/`
   - Export from `packages/ui/src/index.ts`
   - Use in apps with `import { Component } from "@ogm/ui"`

4. **File uploads/storage**:
   - Use `@ogm/storage` package (wraps Supabase Storage)
   - Server-side: `createStorageClient(url, serviceRoleKey)`
   - Client-side: `createPublicStorageClient(url, anonKey)`
   - Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Cross-app auth**: All apps use same Better Auth instance—session state is shared

## Important Constraints

- **No hardcoded URLs**: Use environment variables and `env.ts` files
- **React 19 + Server Components**: Next.js app uses RSC for data fetching; Expo uses client-side queries
- **Tailwind v4**: Must use `@tailwindcss/postcss` (not v3)
- **Node 22+**: Minimum version in `package.json` engines
