This schema is designed specifically for your **T3 Turbo Monorepo** stack. It leverages **Drizzle ORM** with **Postgres** and aligns perfectly with **Better Auth** for identity management.

This schema solves the hardest part of GHL integration: **Multi-tenancy and Identity Mapping**. It separates the *Global User* (Better Auth) from the *Community Member* (GHL Location specific), allowing one user to belong to multiple GHL communities if needed.

### Key Architectural Decisions:

1.  **`communities` Table:** This is your tenant. It maps 1:1 to a GoHighLevel Location.
2.  **`members` Table:** The join table between `user` and `community`. This is where Gamification (Points, Levels) and Permissions live.
3.  **`ghl_tags` Table:** Maps GHL Tags to Community Access Groups (for unlocking courses/channels automatically).
4.  **`media` Columns:** Support for your "Voice Note" and "Video" requirements (using generic URL fields + types).

### File: `packages/db/src/schema.ts`

```typescript
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// -----------------------------------------------------------------------------
// 1. BETTER AUTH SCHEMA (Extended)
// -----------------------------------------------------------------------------
// Note: Better Auth will manage the core fields, but we define them here for foreign keys.
// Run `pnpm auth:generate` to keep this in sync if you add plugins.

export const user = pgTable("user", {
  id: text("id").primaryKey(), // Better Auth uses text IDs by default
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  
  // Custom: Global GHL Identity (if they log in via GHL SSO)
  ghlGlobalUserId: text("ghl_global_user_id"), 
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// -----------------------------------------------------------------------------
// 2. CORE INTEGRATION (Tenants)
// -----------------------------------------------------------------------------

export const communities = pgTable("community", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // for URLs: app.com/c/slug
  
  // GHL Integration Keys
  ghlLocationId: varchar("ghl_location_id", { length: 255 }).notNull().unique(),
  ghlAccessToken: text("ghl_access_token"), // Encrypt this in app logic!
  ghlRefreshToken: text("ghl_refresh_token"),
  ghlTokenExpiresAt: timestamp("ghl_token_expires_at"),
  
  // Customization
  themeColor: varchar("theme_color", { length: 7 }).default("#000000"),
  logoUrl: text("logo_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Member: The link between a User and a Community
export const members = pgTable("member", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  
  // GHL Contact Mapping
  ghlContactId: varchar("ghl_contact_id", { length: 255 }), // The specific contact ID in this location
  ghlTags: jsonb("ghl_tags").$type<string[]>().default([]), // Synced from GHL Webhooks
  
  // Gamification & Role
  role: varchar("role", { length: 20 }).default("member"), // 'admin', 'moderator', 'member'
  level: integer("level").default(1),
  points: integer("points").default(0),
  
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (t) => ({
  unq: index("member_user_community_idx").on(t.userId, t.communityId),
}));

// -----------------------------------------------------------------------------
// 3. SOCIAL ENGINE (Skool/Facebook Clone)
// -----------------------------------------------------------------------------

export const channels = pgTable("channel", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // lucide-react icon name
  isPrivate: boolean("is_private").default(false),
  
  // Permissions: Which GHL tags can view/post?
  requiredGhlTags: jsonb("required_ghl_tags").$type<string[]>().default([]),
  
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("post", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"), // Rich text or Markdown
  
  // Media Attachments
  mediaUrl: text("media_url"),
  mediaType: varchar("media_type", { length: 20 }), // 'image', 'video', 'audio' (voice note)
  
  isPinned: boolean("is_pinned").default(false),
  commentCount: integer("comment_count").default(0),
  likeCount: integer("like_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comment", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"), // For nested replies
  
  content: text("content"),
  voiceNoteUrl: text("voice_note_url"), // Specific field for your voice feature
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("like", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  unqPost: index("like_post_member_idx").on(t.postId, t.memberId),
}));

// -----------------------------------------------------------------------------
// 4. LMS ENGINE (Course Platform)
// -----------------------------------------------------------------------------

export const courses = pgTable("course", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").notNull().references(() => communities.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  published: boolean("published").default(false),
  
  // Unlocking Logic
  unlockGhlTag: varchar("unlock_ghl_tag", { length: 255 }), // e.g., "purchased-course-a"
  unlockLevel: integer("unlock_level"), // Gamification unlock
  
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modules = pgTable("module", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  position: integer("position").default(0),
});

export const lessons = pgTable("lesson", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  
  // Content
  videoUrl: text("video_url"), // Mux, Vimeo, or YouTube link
  content: text("content"), // Text description/resources
  isPreview: boolean("is_preview").default(false), // Allow viewing without unlock?
  
  position: integer("position").default(0),
});

export const userProgress = pgTable("user_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").defaultNow(),
}, (t) => ({
  unq: index("progress_member_lesson_idx").on(t.memberId, t.lessonId),
}));

// -----------------------------------------------------------------------------
// 5. RELATIONS (For tRPC)
// -----------------------------------------------------------------------------

export const communitiesRelations = relations(communities, ({ many }) => ({
  members: many(members),
  channels: many(channels),
  courses: many(courses),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(user, { fields: [members.userId], references: [user.id] }),
  community: one(communities, { fields: [members.communityId], references: [communities.id] }),
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  progress: many(userProgress),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  channel: one(channels, { fields: [posts.channelId], references: [channels.id] }),
  author: one(members, { fields: [posts.authorId], references: [members.id] }),
  comments: many(comments),
  likes: many(likes),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  progress: many(userProgress),
}));
```

### Steps to Implement in your Monorepo:

1.  **Replace content:** Copy the above code into `packages/db/src/schema.ts`.
2.  **Generate Auth:** Run `pnpm auth:generate`. Better Auth will detect the user/session tables defined here. If it complains about existing tables, you may need to clear the migration folder or adjust `auth-schema.ts`.
3.  **Push Schema:** Run `pnpm db:push`.
4.  **Integration Logic:**
      * **On GHL Iframe Load:** Your tRPC endpoint will check if a `user` exists with `ghlContactId`. If not, it creates a `user` (Better Auth) AND a `member` (Community Link).
      * **On Webhook:** When GHL sends a "Contact Tag Updated" webhook, you update the `ghlTags` array in the `members` table.
      * **Permissions:** Your tRPC "middle-ware" (in `packages/api`) should check `member.ghlTags` against `channel.requiredGhlTags` before fetching private content.