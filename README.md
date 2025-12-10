<div align="center">
  <h1>🚀 OGM Platform</h1>
  <p><strong>Multi-Tenant LMS & Social Platform with GoHighLevel Integration</strong></p>
  <p>
    <a href="#-overview">Overview</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-development">Development</a> •
    <a href="#-deployment">Deployment</a>
  </p>
</div>

---

## 📖 Overview

A comprehensive **multi-tenant learning management system (LMS)** and **social platform** built with modern TypeScript tooling. Seamlessly integrates with **GoHighLevel** for CRM and identity management, delivering a unified experience across web, mobile, and API surfaces.

### 🎯 Core Engines

- **Community Engine** – Multi-tenant workspaces mapped to GHL Locations with role-based access control
- **Social Engine** – Forum-style discussions with channel-based organization and tag-driven permissions
- **LMS Engine** – Full-featured course delivery with progress tracking and video hosting

### ✨ What Makes This Special

- **Type-Safe Monorepo** – Turborepo orchestrates shared packages across Next.js, Expo, and TanStack Start
- **End-to-End Type Safety** – tRPC v11 powers full-stack type inference from database to UI
- **Multi-Platform** – Same backend logic serves web (Next.js/TanStack Start), iOS, and Android (Expo)
- **GoHighLevel Native** – Deep CRM integration with OAuth, webhooks, and contact synchronization
- **Modern DX** – Biome for linting/formatting, pnpm workspace with catalog versioning, React 19

---

## 🏗️ Architecture

## 🏗️ Architecture

### Monorepo Structure

```text
ogm/
├── apps/                          # Frontend applications
│   ├── nextjs/                    # Next.js 15 (React Server Components)
│   ├── expo/                      # React Native (iOS & Android)
│   └── tanstack-start/            # TanStack Start (Alternative web)
│
├── packages/                      # Shared business logic
│   ├── @ogm/api/                  # tRPC v11 router definitions
│   ├── @ogm/auth/                 # Better Auth integration
│   ├── @ogm/db/                   # Drizzle ORM + Supabase Postgres
│   ├── @ogm/storage/              # Supabase Storage client
│   ├── @ogm/ui/                   # shadcn-ui + Tailwind v4
│   └── @ogm/validators/           # Zod v4 schemas
│
└── tooling/                       # Shared configurations
    ├── tailwind/                  # Tailwind theme & PostCSS
    ├── typescript/                # Shared TSConfig
    └── github/                    # CI/CD workflows
```

### Domain Model

#### Multi-Tenancy

Communities are the top-level tenant. Each community:
- Maps to a **GoHighLevel Location** (`ghlLocationId`)
- Has members with roles: `owner`, `admin`, `moderator`, `member`
- Controls access to channels via GHL tag matching

#### Data Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Apps      │─────▶│  tRPC API    │─────▶│  Database   │
│ (Type-safe) │◀─────│ (@ogm/api)   │◀─────│  (Drizzle)  │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                      │
       │                     │                      │
       ▼                     ▼                      ▼
  Better Auth         Authorization           GoHighLevel
   (Session)         (memberProcedure)         (Webhooks)
```

### Custom tRPC Procedures

Authorization is enforced at the procedure level:

| Procedure | Auth | Community | Role Required | Use Case |
|-----------|------|-----------|---------------|----------|
| `publicProcedure` | ❌ | ❌ | None | Public endpoints |
| `protectedProcedure` | ✅ | ❌ | Authenticated | User-scoped |
| `memberProcedure` | ✅ | ✅ | Member+ | Community access |
| `moderatorProcedure` | ✅ | ✅ | Moderator+ | Content moderation |
| `adminProcedure` | ✅ | ✅ | Admin+ | Community settings |
| `ownerProcedure` | ✅ | ✅ | Owner | Billing, deletion |

---

## 💻 Tech Stack

### Frontend

- **React 19** – Latest React with concurrent features
- **Next.js 15** – React Server Components, App Router
- **Expo SDK 54** – Cross-platform mobile (iOS/Android)
- **TanStack Start** – Full-stack React framework (alternative to Next.js)
- **Tailwind CSS v4** – Utility-first styling (NativeWind v5 for Expo)

### Backend

- **tRPC v11** – End-to-end type-safe APIs
- **Better Auth** – Authentication with OAuth & SSO
- **Drizzle ORM** – Type-safe SQL query builder
- **Supabase** – Postgres database (Vercel Postgres driver for edge)
- **Supabase Storage** – File uploads & CDN

### DevOps & Tooling

- **Turborepo** – High-performance build system
- **pnpm** – Fast, disk-space efficient package manager
- **Biome** – All-in-one linter & formatter (replaces ESLint + Prettier)
- **TypeScript** – Strict type checking across all packages
- **Zod v4** – Runtime schema validation

### Integrations

- **GoHighLevel** – CRM, OAuth, contact sync via webhooks
- **Vercel** – Deployment for Next.js (edge runtime)
- **EAS** – Expo Application Services for mobile builds

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the required versions:

```bash
node --version  # Should be ^22.21.0
pnpm --version  # Should be ^10.19.0
```

### Installation

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ogm

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials (Supabase, GHL, etc.)

# 4. Generate Better Auth schema
pnpm auth:generate

# 5. Push database schema
pnpm db:push

# 6. Start development servers (all apps in watch mode)
pnpm dev
```

### Environment Variables

Create a `.env` file with these required variables:

```bash
# Database (Supabase)
POSTGRES_URL="postgresql://..."           # Standard connection
POSTGRES_URL_NON_POOLING="postgresql://..." # For migrations

# Supabase Storage
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."

# Better Auth
BETTER_AUTH_SECRET="<generate-with-openssl-rand>"
BETTER_AUTH_URL="http://localhost:3000"   # Your deployed URL in production

# GoHighLevel
GHL_CLIENT_ID="xxx"
GHL_CLIENT_SECRET="xxx"
GHL_REDIRECT_URI="http://localhost:3000/api/auth/ghl/callback"
```

### Development Commands

```bash
# Start all apps in watch mode
pnpm dev

# Start only Next.js app + dependencies
pnpm dev:next

# Build all packages and apps
pnpm build

# Lint with Biome
pnpm check

# Format with Biome
pnpm format

# Type-check all packages
pnpm typecheck

# Database management
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio

# Add shadcn-ui component
pnpm ui-add
```

---

## 🔧 Development

### Adding a New tRPC Endpoint

1. **Define the router** in `packages/api/src/router/`:

```typescript
// packages/api/src/router/posts.ts
import { z } from "zod";
import { createTRPCRouter, memberProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  create: memberProcedure
    .input(z.object({
      communityId: z.string().uuid(),
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ctx.member is automatically populated with role info
      return ctx.db.insert(schema.posts).values({
        ...input,
        authorId: ctx.session.user.id,
      });
    }),
});
```

2. **Export from root router** in `packages/api/src/root.ts`:

```typescript
import { postRouter } from "./router/posts";

export const appRouter = createTRPCRouter({
  post: postRouter,
  // ... other routers
});
```

3. **Use in clients** – types propagate automatically:

```typescript
// Next.js (Server Component)
const posts = await trpc.post.create({ communityId, title, content });

// Client Component or Expo
const mutation = trpc.post.create.useMutation();
```

### Adding a Database Table

1. **Define schema** in `packages/db/src/schema.ts`:

```typescript
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id),
  authorId: text("author_id").notNull().references(() => user.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

2. **Push to database**:

```bash
pnpm db:push
```

3. **Use in tRPC procedures**:

```typescript
const result = await ctx.db.query.posts.findMany({
  where: eq(posts.communityId, input.communityId),
});
```

### Adding a UI Component

**Option 1: Use shadcn-ui CLI (recommended)**

```bash
pnpm ui-add
# Select components interactively
```

**Option 2: Manual creation**

1. Create in `packages/ui/src/my-component.tsx`
2. Export from `packages/ui/src/index.ts`
3. Use: `import { MyComponent } from "@ogm/ui"`

### GoHighLevel Integration

#### OAuth Flow

```typescript
// User clicks "Connect GHL" button
// Redirect to GHL OAuth URL with your client_id

// On callback:
const result = await trpc.ghl.exchangeCode.mutate({
  code: searchParams.get("code"),
  communityId,
});

// Access token stored encrypted in communities.ghlAccessToken
```

#### Webhook Handler

```typescript
// POST /api/ghl/webhook
// GHL sends contact updates

await trpc.ghl.syncContact.mutate({
  ghlContactId: webhook.contact.id,
  ghlLocationId: webhook.location.id,
  email: webhook.contact.email,
  // ... other fields
});

// Creates/updates user and member records
```

### File Uploads (Supabase Storage)

**Server-side:**

```typescript
import { createStorageClient } from "@ogm/storage";

const storage = createStorageClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const { url } = await storage.upload({
  bucket: "avatars",
  path: `${userId}/profile.jpg`,
  file: fileBuffer,
});
```

**Client-side:**

```typescript
import { createPublicStorageClient } from "@ogm/storage/client";

const storage = createPublicStorageClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

---

## 📦 Package Management

### Workspace Protocol

Import shared packages using the `@ogm/*` namespace:

```typescript
import { db } from "@ogm/db/client";
import { Button } from "@ogm/ui";
import { createCourseSchema } from "@ogm/validators";
```

### Dependency Catalog

Shared dependency versions are managed in `pnpm-workspace.yaml`:

```yaml
catalog:
  "@trpc/server": "11.0.0-rc.653"
  "react": "19.0.0"
  "zod": "^4.0.0-beta.2"
```

Reference in `package.json`:

```json
{
  "dependencies": {
    "@trpc/server": "catalog:",
    "react": "catalog:react19"
  }
}
```

### Adding a New Package

```bash
pnpm turbo gen init
# Follow prompts for package name and dependencies
```

This scaffolds:
- `package.json` with correct metadata
- `tsconfig.json` extending shared config
- `src/index.ts` entry point
- Biome and TypeScript configuration

---

## 🚢 Deployment

### Next.js (Vercel)

### Next.js (Vercel)

**Prerequisites:** Deploy Next.js app first – required for Expo to communicate with backend.

1. **Create Vercel project**
   - Select `apps/nextjs` as root directory
   - Vercel auto-detects Next.js configuration

2. **Add environment variables** in Vercel dashboard:
   ```
   POSTGRES_URL
   POSTGRES_URL_NON_POOLING
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   BETTER_AUTH_SECRET
   BETTER_AUTH_URL=https://your-domain.com
   GHL_CLIENT_ID
   GHL_CLIENT_SECRET
   GHL_REDIRECT_URI
   ```

3. **Deploy** – Push to `main` branch to trigger deployment

4. **Update Expo** – Set production URL in `apps/expo/src/utils/api.tsx`:
   ```typescript
   const getBaseUrl = () => {
     if (process.env.NODE_ENV === "development") {
       return "http://localhost:3000";
     }
     return "https://your-domain.com"; // Your Vercel URL
   };
   ```

### Better Auth Proxy (OAuth for Expo)

The auth proxy plugin enables OAuth in development and preview deployments:

- **How it works:** Next.js forwards auth requests to a stable proxy URL
- **Why:** Prevents OAuth callback issues when running on different ports
- **Setup:** Already configured in `packages/auth/src/index.ts`

Once Next.js is deployed, the proxy URL is your Vercel domain. No additional configuration needed.

### Expo (EAS Build)

1. **Install EAS CLI**

```bash
pnpm add -g eas-cli
eas login
```

2. **Configure EAS**

```bash
cd apps/expo
eas build:configure
```

3. **Create production build**

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

4. **Submit to app stores**

```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

5. **Enable OTA updates**

```bash
# Install expo-updates
pnpm expo install expo-updates

# Configure
eas update:configure

# Send update (after initial app store approval)
eas update --auto
```

> **Note:** Native changes (new dependencies, config changes) require rebuilding and resubmitting to stores. JavaScript-only changes can use OTA updates.

---

## 🔐 Security Best Practices

### Environment Variables

- **Never commit `.env` files** – Use `.env.example` as template
- **Strict validation** – All env vars validated via `env.ts` files with Zod
- **Edge runtime** – Uses Vercel Postgres driver (`:6543` pooling) for edge compatibility

### Authorization Pattern

Always use appropriate procedures:

```typescript
// ❌ BAD: No authorization check
export const deletePost = publicProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    await ctx.db.delete(posts).where(eq(posts.id, input.postId));
  });

// ✅ GOOD: Proper authorization
export const deletePost = memberProcedure
  .input(z.object({ 
    communityId: z.string().uuid(),
    postId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // ctx.member is populated with role info
    const post = await ctx.db.query.posts.findFirst({
      where: eq(posts.id, input.postId),
    });
    
    if (post.authorId !== ctx.session.user.id && 
        !["admin", "owner"].includes(ctx.member.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    await ctx.db.delete(posts).where(eq(posts.id, input.postId));
  });
```

### Database Security

- **Row-level security** – Configure in Supabase for additional protection
- **Service role key** – Only use server-side, never expose to clients
- **Anon key** – Safe for client use, restricted by RLS policies

---

## 🧪 Testing & Quality

### Code Quality Tools

```bash
# Lint all packages (Biome)
pnpm check

# Format all files
pnpm format

# Type-check entire monorepo
pnpm typecheck

# Check workspace consistency
pnpm lint:ws
```

### Biome Configuration

Configured in `biome.json`:
- Line width: 80 characters
- Quotes: Double
- Semicolons: Required
- Recommended rules + custom overrides

**Suppress warnings:**

```typescript
// biome-ignore lint/suspicious/noExplicitAny: tRPC context inference
const myFunction = (ctx: any) => { ... };
```

---

## 📚 Key Concepts

### Type Safety Flow

```
Database Schema (Drizzle)
    ↓
tRPC Router Input/Output (Zod)
    ↓
AppRouter Type Export
    ↓
Client Type Inference (React Query)
    ↓
UI Components (TypeScript)
```

**Result:** Change database schema → TypeScript errors appear in UI components

### Multi-Tenancy Pattern

Every community-scoped endpoint must:
1. Accept `communityId` in input schema
2. Use `memberProcedure` or higher
3. Access `ctx.member` for role-based logic

```typescript
// Input schema extends communityId
.input(z.object({
  communityId: z.string().uuid(),
  // ... other fields
}))

// Procedure ensures membership
export const myEndpoint = memberProcedure
  .input(communitySchema)
  .mutation(async ({ ctx, input }) => {
    // ctx.member.role is "owner" | "admin" | "moderator" | "member"
    // ctx.member.communityId === input.communityId (validated)
  });
```

### GHL Integration Architecture

**Identity Flow:**
1. User signs up → Better Auth creates `user` record
2. GHL webhook fires → `syncContact` creates `member` record
3. Member has `ghlContactId` + `ghlTags` for channel access

**Data Sync:**
- Communities: `ghlLocationId` + `ghlAccessToken` (encrypted)
- Members: `ghlContactId` + `ghlTags` array
- Channels: `ghlTags` array for access control

---

## 🤝 Contributing

### Workflow

1. Create feature branch from `main`
2. Make changes in appropriate package
3. Run quality checks:
   ```bash
   pnpm check && pnpm typecheck && pnpm build
   ```
4. Commit with conventional commits format
5. Open pull request

### Commit Convention

```
feat: add course progress tracking
fix: resolve member role permission check
docs: update installation guide
chore: bump dependencies
```

---

## 📖 Additional Resources

### Documentation Links

- [Turborepo](https://turbo.build/repo/docs) – Monorepo build system
- [tRPC](https://trpc.io) – Type-safe API layer
- [Drizzle ORM](https://orm.drizzle.team) – Database toolkit
- [Better Auth](https://better-auth.com) – Authentication framework
- [Next.js 15](https://nextjs.org/docs) – React framework
- [Expo](https://docs.expo.dev) – React Native platform
- [shadcn/ui](https://ui.shadcn.com) – Component library
- [GoHighLevel API](https://highlevel.stoplight.io) – CRM integration

### Monorepo Patterns

This project follows the [T3 Turbo](https://github.com/t3-oss/create-t3-turbo) architecture with enhancements:
- Custom tRPC procedures for authorization
- GoHighLevel integration layer
- Multi-tenant domain model
- Shared validators and UI components

---

## ⚖️ License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with inspiration from:
- [create-t3-app](https://create.t3.gg) – T3 Stack foundation
- [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo) – Monorepo architecture
- [Julius' Blog Post](https://jumr.dev/blog/t3-turbo) – Migration guide

---

<div align="center">
  <p>Made with ❤️ by the OGM Team</p>
  <p>
    <a href="https://github.com/OmarHosamCodes/ogm-reimagined">⭐ Star on GitHub</a>
  </p>
</div>
