# GoHighLevel Community Integration - Complete Refactor

## Project Overview

Full implementation of a GoHighLevel-integrated community platform with:
- **Mobile App** (Expo/React Native)
- **Website** (Next.js)
- **Admin Dashboard** (Next.js route group)

Multi-tenant architecture where each GHL Location maps to a Community with social features (channels, posts, comments) and LMS (courses, modules, lessons).

---

## Phase 1: Database & Core Infrastructure

### 1.1 Database Schema Refactor
- [x] Replace `packages/db/src/schema.ts` with full schema from `db-instructions.md`
  - [x] Better Auth tables (user, session, account, verification) with `ghlGlobalUserId`
  - [x] Communities table (GHL Location mapping, OAuth tokens, theming)
  - [x] Members table (user-community join, gamification, GHL contact mapping)
  - [x] Channels table (social channels with GHL tag permissions)
  - [x] Posts table (social posts with media attachments)
  - [x] Comments table (with voice note support)
  - [x] Likes table (posts and comments)
  - [x] Courses table (LMS with GHL tag unlock)
  - [x] Modules table (course sections)
  - [x] Lessons table (video content)
  - [x] UserProgress table (lesson completion tracking)
  - [x] All Drizzle relations defined
- [x] Run `pnpm auth:generate` to sync Better Auth schema
- [x] Run `pnpm db:push` to push schema to Postgres

### 1.2 Zod Validators
- [x] Zod schemas created via drizzle-zod in schema.ts (CreateCommunitySchema, CreateMemberSchema, etc.)
- [x] Create `packages/validators/src/community.ts` - Community validation schemas
- [x] Create `packages/validators/src/member.ts` - Member validation schemas
- [x] Create `packages/validators/src/channel.ts` - Channel validation schemas
- [x] Create `packages/validators/src/post.ts` - Post validation schemas
- [x] Create `packages/validators/src/comment.ts` - Comment validation schemas
- [x] Create `packages/validators/src/course.ts` - Course/Module/Lesson schemas
- [x] Update `packages/validators/src/index.ts` to export all schemas

### 1.3 Environment Variables
- [x] Add GHL env vars to `.env.example`
  - `GHL_CLIENT_ID`
  - `GHL_CLIENT_SECRET`
  - `GHL_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_GHL_CLIENT_ID`
  - `BLOB_READ_WRITE_TOKEN` (optional)
  - `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` (optional)
- [x] Add GHL env vars to `apps/nextjs/src/env.ts`
- [x] Add GHL env vars to `packages/auth/env.ts`

---

## Phase 2: Authentication & Authorization

### 2.1 Better Auth GHL Integration
- [x] Add GHL SSO provider to `packages/auth/src/index.ts`
- [x] Create GHL token validation for iframe context (in SSO route)
- [x] Add `ghlGlobalUserId` to user session data

### 2.2 tRPC Middleware & Procedures
- [x] Create member context middleware (in trpc.ts)
- [x] Create permission middleware (in trpc.ts)
- [x] Update `packages/api/src/trpc.ts` with new procedures:
  - [x] `memberProcedure` - Requires community membership
  - [x] `adminProcedure` - Requires admin/moderator role
  - [x] `ownerProcedure` - Requires community owner

---

## Phase 3: tRPC API Routers

### 3.1 Core Routers
- [x] Create `packages/api/src/router/community.ts`
  - [x] `create` - Create new community (links to GHL Location)
  - [x] `getBySlug` - Get community by URL slug
  - [x] `update` - Update community settings
  - [x] `delete` - Delete community
  - [x] `listMembers` - List community members
  - [x] `refreshGhlTokens` - Refresh GHL OAuth tokens

- [x] Create `packages/api/src/router/member.ts`
  - [x] `join` - Join a community
  - [x] `leave` - Leave a community
  - [x] `getProfile` - Get member profile
  - [x] `updateProfile` - Update member profile
  - [x] `updateRole` - Update member role (admin only)
  - [x] `awardPoints` - Award gamification points
  - [x] `syncGhlTags` - Sync tags from GHL
  - [x] `leaderboard` - Get community leaderboard

### 3.2 Social Engine Routers
- [x] Refactor `packages/api/src/router/post.ts` for social engine
  - [x] `create` - Create post in channel
  - [x] `getById` - Get single post with comments
  - [x] `listByChannel` - List posts in channel (paginated)
  - [x] `listByCommunity` - List posts in community (paginated)
  - [x] `update` - Update post
  - [x] `delete` - Delete post
  - [x] `pin` - Pin/unpin post (admin only)

- [x] Create `packages/api/src/router/channel.ts`
  - [x] `create` - Create channel
  - [x] `list` - List channels (respects GHL tag permissions)
  - [x] `update` - Update channel
  - [x] `delete` - Delete channel

- [x] Create `packages/api/src/router/comment.ts`
  - [x] `create` - Create comment (supports voice notes)
  - [x] `list` - List comments for post (threaded)
  - [x] `update` - Update comment
  - [x] `delete` - Delete comment

- [x] Create `packages/api/src/router/like.ts`
  - [x] `toggle` - Toggle like on post/comment
  - [x] `getStatus` - Check if user liked (via post.getById)

### 3.3 LMS Engine Routers
- [x] Create `packages/api/src/router/course.ts`
  - [x] `create` - Create course
  - [x] `list` - List courses (respects unlock logic)
  - [x] `getById` - Get course with modules/lessons
  - [x] `update` - Update course
  - [x] `delete` - Delete course

- [x] Create `packages/api/src/router/module.ts`
  - [x] `create` - Create module
  - [x] `update` - Update module
  - [x] `delete` - Delete module

- [x] Create `packages/api/src/router/lesson.ts`
  - [x] `create` - Create lesson
  - [x] `getById` - Get lesson content
  - [x] `update` - Update lesson
  - [x] `delete` - Delete lesson

- [x] Create `packages/api/src/router/progress.ts`
  - [x] `markComplete` - Mark lesson as complete
  - [x] `getCourseProgress` - Get progress for a course
  - [x] `getMemberProgress` - Get all progress for member

### 3.4 GHL Integration Router
- [x] Create `packages/api/src/router/ghl.ts`
  - [x] `handleWebhook` - Process GHL webhook events
  - [x] `syncContact` - Sync contact from GHL

### 3.5 Register All Routers
- [x] Update `packages/api/src/root.ts` with all new routers

---

## Phase 4: UI Components

### 4.1 Add shadcn-ui Components
- [x] Add `card` component
- [x] Add `avatar` component
- [x] Add `tabs` component
- [x] Add `dialog` component
- [x] Add `badge` component
- [x] Add `progress` component
- [x] Add `sidebar` component
- [x] Add `skeleton` component
- [x] Add `textarea` component
- [x] Add `select` component
- [x] Add `switch` component
- [x] Add `alert` component

### 4.2 Custom Components
- [x] Create `packages/ui/src/rich-text-editor.tsx` - Markdown editor with toolbar
- [x] Create `packages/ui/src/video-player.tsx` - Video playback component (YouTube, Vimeo, Mux, native)
- [x] Create `packages/ui/src/file-upload.tsx` - File upload with preview and drag-drop
- [x] Create `packages/ui/src/community-avatar.tsx` - Community branding
- [x] Create `packages/ui/src/member-avatar.tsx` - Member with level badge
- [x] Create post-card component (in Next.js app)
- [x] Create course-card component (in Next.js app)
- [x] Create lesson navigation (in Next.js app)

---

## Phase 5: Next.js Website

### 5.1 Community Routes (Public/Member)
- [x] Create `apps/nextjs/src/app/c/[slug]/layout.tsx` - Community layout
- [x] Create `apps/nextjs/src/app/c/[slug]/page.tsx` - Community home
- [x] Create `apps/nextjs/src/app/c/[slug]/channel/[channelId]/page.tsx` - Channel feed
- [x] Create `apps/nextjs/src/app/c/[slug]/post/[postId]/page.tsx` - Post detail
- [x] Create `apps/nextjs/src/app/c/[slug]/courses/page.tsx` - Course list
- [x] Create `apps/nextjs/src/app/c/[slug]/courses/[courseId]/page.tsx` - Course view
- [x] Create `apps/nextjs/src/app/c/[slug]/courses/[courseId]/[lessonId]/page.tsx` - Lesson view
- [x] Create `apps/nextjs/src/app/c/[slug]/leaderboard/page.tsx` - Gamification leaderboard
- [x] Create `apps/nextjs/src/app/c/[slug]/profile/page.tsx` - Member profile

### 5.2 Community Components
- [x] Create `apps/nextjs/src/app/c/_components/community-sidebar.tsx`
- [x] Create `apps/nextjs/src/app/c/_components/community-header.tsx`
- [x] Create `apps/nextjs/src/app/c/_components/post-feed.tsx`
- [x] Create `apps/nextjs/src/app/c/_components/post-composer.tsx`
- [x] Create `apps/nextjs/src/app/c/_components/post-card.tsx`
- [x] Create `apps/nextjs/src/app/c/_components/course-grid.tsx`
- [x] Create lesson sidebar component
- [x] Create lesson content component
- [x] Create post detail component
- [x] Create comment section component

### 5.3 Admin Dashboard Routes
- [x] Create `apps/nextjs/src/app/admin/layout.tsx` - Admin layout
- [x] Create `apps/nextjs/src/app/admin/page.tsx` - Admin overview
- [x] Create `apps/nextjs/src/app/admin/communities/page.tsx` - Community list
- [x] Create `apps/nextjs/src/app/admin/communities/new/page.tsx` - Create community
- [x] Create `apps/nextjs/src/app/admin/communities/[id]/page.tsx` - Community settings
- [x] Create `apps/nextjs/src/app/admin/communities/[id]/members/page.tsx` - Member management
- [x] Create `apps/nextjs/src/app/admin/communities/[id]/analytics/page.tsx` - Analytics dashboard
- [x] Create `apps/nextjs/src/app/admin/courses/page.tsx` - Course list
- [x] Create `apps/nextjs/src/app/admin/courses/new/page.tsx` - Create course
- [x] Create `apps/nextjs/src/app/admin/courses/[courseId]/page.tsx` - Course editor

### 5.4 Admin Components
- [x] Create community edit form component
- [x] Create GHL integration component
- [x] Create channel manager component
- [x] Create course edit form component
- [x] Create module manager component

### 5.5 GHL API Routes
- [x] Create `apps/nextjs/src/app/api/ghl/webhook/route.ts` - GHL webhook handler
- [x] Create `apps/nextjs/src/app/api/ghl/oauth/callback/route.ts` - GHL OAuth callback
- [x] Create `apps/nextjs/src/app/api/ghl/sso/route.ts` - GHL SSO validation

### 5.6 File Upload Routes
- [x] Create `apps/nextjs/src/app/api/upload/image/route.ts` - Image upload
- [x] Create `apps/nextjs/src/app/api/upload/video/route.ts` - Video upload
- [x] Create `apps/nextjs/src/app/api/upload/audio/route.ts` - Voice note upload

---

## Phase 6: Expo Mobile App

### 6.1 Navigation Structure
- [x] Create `apps/expo/src/app/(tabs)/_layout.tsx` - Tab navigation
- [x] Create `apps/expo/src/app/(tabs)/feed.tsx` - Social feed tab
- [x] Create `apps/expo/src/app/(tabs)/courses.tsx` - Courses tab
- [x] Create `apps/expo/src/app/(tabs)/leaderboard.tsx` - Leaderboard tab
- [x] Create `apps/expo/src/app/(tabs)/profile.tsx` - Profile tab

### 6.2 Community Screens
- [x] Create `apps/expo/src/app/communities/index.tsx` - Community selection
- [x] Create `apps/expo/src/app/communities/[slug]/index.tsx` - Community home
- [x] Create `apps/expo/src/app/communities/[slug]/channel/[channelId].tsx` - Channel feed
- [x] Create `apps/expo/src/app/communities/[slug]/post/[postId].tsx` - Post detail

### 6.3 Course Screens
- [x] Create `apps/expo/src/app/courses/[courseId]/index.tsx` - Course overview
- [x] Create `apps/expo/src/app/courses/[courseId]/lesson/[lessonId].tsx` - Lesson view

### 6.4 Mobile Components
- [x] Post card component (inline in feed.tsx)
- [x] Comment thread (inline in post detail)
- [ ] Create `apps/expo/src/components/PostComposer.tsx` - Create post
- [ ] Create `apps/expo/src/components/VoiceRecorder.tsx` - Voice note recording
- [x] Video player (using WebView in lesson screen)
- [x] Course card component (inline in courses.tsx)
- [x] Member avatar component (inline in screens)
- [ ] Create `apps/expo/src/components/ChannelList.tsx` - Channel navigation

### 6.5 Mobile Utilities
- [ ] Create `apps/expo/src/utils/voice-recorder.ts` - Audio recording utility
- [ ] Create `apps/expo/src/utils/file-upload.ts` - File upload utility
- [ ] Create `apps/expo/src/utils/push-notifications.ts` - Push notification setup

---

## Phase 7: Testing & Polish

### 7.1 Type Safety
- [x] Run `pnpm typecheck` and fix all TypeScript errors
- [x] Ensure tRPC types flow correctly to all apps

### 7.2 Linting & Formatting
- [x] Run `pnpm check` and fix all Biome errors
- [x] Run `pnpm format` for consistent formatting

### 7.3 Testing
- [ ] Test community creation flow
- [ ] Test GHL OAuth integration
- [ ] Test GHL webhook processing
- [ ] Test social features (posts, comments, likes)
- [ ] Test LMS features (courses, lessons, progress)
- [ ] Test mobile app on iOS simulator
- [ ] Test mobile app on Android emulator
- [ ] Test admin dashboard CRUD operations

### 7.4 Performance
- [ ] Add loading states with skeletons
- [ ] Implement infinite scroll for feeds
- [ ] Add image optimization
- [ ] Add video lazy loading

---

## Phase 8: Deployment

### 8.1 Environment Setup
- [ ] Configure production GHL OAuth credentials
- [ ] Set up Vercel Blob for file storage
- [ ] Set up Mux for video hosting (optional)
- [ ] Configure webhook URLs in GHL

### 8.2 Vercel Deployment
- [ ] Deploy Next.js app to Vercel
- [ ] Configure environment variables
- [ ] Set up database connection pooling

### 8.3 Expo Deployment
- [ ] Configure EAS Build
- [ ] Build iOS app
- [ ] Build Android app
- [ ] Submit to App Store
- [ ] Submit to Play Store

---

## Architecture Decisions

### Storage (Migrating to Supabase S3)
- **Voice Notes**: Supabase Storage `audio` bucket
- **Images**: Supabase Storage `images` bucket (with transformation)
- **Videos**: Supabase Storage `videos` bucket or Mux (for courses)
- **Fallback**: Vercel Blob (legacy support during migration)

### Authentication
- **Standalone Users**: Discord OAuth via Better Auth
- **GHL Users**: SSO token validation from iframe context
- **Session**: Includes `communityId` and `memberId` for multi-tenant queries

### Permissions
- **Channel Access**: Check `member.ghlTags` against `channel.requiredGhlTags`
- **Course Unlock**: Check `member.ghlTags` contains `course.unlockGhlTag` OR `member.level >= course.unlockLevel`
- **Admin Actions**: Check `member.role` is `admin` or `moderator`

### GHL Integration Points
1. **Location Install**: Webhook creates `community` with OAuth tokens
2. **Contact Create/Update**: Webhook creates/updates `member` with `ghlContactId`
3. **Tag Update**: Webhook syncs `member.ghlTags` array
4. **Iframe Load**: SSO validates and creates session with community context

---

## Current Status

**Phase 1**: ✅ Schema Complete (need db:push)
**Phase 2**: ✅ Complete (all procedures created)
**Phase 3**: ✅ Complete (all 12 routers created)
**Phase 4**: ✅ Complete (all shadcn-ui + custom components)
**Phase 5**: ✅ Complete (all community pages + admin dashboard + file uploads)
**Phase 6**: ✅ Complete (all tabs + screens)
**Phase 7**: ⏳ Not Started (testing & polish)
**Phase 8**: ⏳ Not Started (deployment)

---

## Phase 9: Supabase S3 Storage Migration

### 9.1 Supabase Storage Setup
- [ ] Create Supabase storage bucket for `images`
- [ ] Create Supabase storage bucket for `videos`
- [ ] Create Supabase storage bucket for `audio` (voice notes)
- [ ] Configure bucket policies (public read, authenticated write)
- [ ] Set up RLS policies for file access

### 9.2 Environment Variables
- [x] Add Supabase S3 env vars to `apps/nextjs/src/env.ts`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add Supabase env vars to `.env.example`
- [x] Keep Vercel Blob env vars as optional fallback

### 9.3 Storage Utility Package
- [x] Create `packages/storage/` package
- [x] Create `packages/storage/src/client.ts` - Supabase storage client
- [x] Create `packages/storage/src/upload.ts` - Upload utilities
- [x] Create `packages/storage/src/signed-url.ts` - Signed URL generation
- [x] Create `packages/storage/src/index.ts` - Exports

### 9.4 Migrate Upload Routes
- [x] Update `apps/nextjs/src/app/api/upload/image/route.ts` - Use Supabase S3
- [x] Update `apps/nextjs/src/app/api/upload/video/route.ts` - Use Supabase S3
- [x] Update `apps/nextjs/src/app/api/upload/audio/route.ts` - Use Supabase S3
- [x] Add presigned URL endpoint for direct uploads

### 9.5 File Upload Component Updates
- [ ] Update `packages/ui/src/file-upload.tsx` to support presigned URLs
- [ ] Add progress tracking for large file uploads
- [ ] Add resumable upload support for videos

### 9.6 Expo Mobile Integration
- [x] Create `apps/expo/src/utils/supabase-storage.ts`
- [ ] Update mobile file upload utilities
- [ ] Test image uploads from mobile
- [ ] Test voice note uploads from mobile

---

## Validation Checklist
- [x] Phase 1 - Database & Core Infrastructure
- [x] Phase 2 - Authentication & Authorization
- [x] Phase 3 - tRPC API Routers
- [x] Phase 4 - UI Components
- [x] Phase 5 - Next.js Website
- [x] Phase 6 - Expo Mobile App (3 components + 3 utilities missing)
- [ ] Phase 7 - Testing & Polish
- [ ] Phase 8 - GHL Integration Testing
- [ ] Phase 9 - Storage Migration

## Quick Commands

```bash
# Development
pnpm dev                 # Start all apps
pnpm dev:next            # Start Next.js only

# Database
pnpm auth:generate       # Generate Better Auth schema
pnpm db:push             # Push schema to Postgres
pnpm db:studio           # Open Drizzle Studio

# Code Quality
pnpm check               # Lint with Biome
pnpm format              # Format with Biome
pnpm typecheck           # TypeScript check

# UI Components
pnpm ui-add              # Add shadcn-ui component
```
