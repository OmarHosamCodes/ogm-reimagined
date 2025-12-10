import { relations, sql } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Re-export auth schema
export * from "./auth-schema";

// -----------------------------------------------------------------------------
// 1. COMMUNITIES (Tenants - Maps to GHL Locations)
// -----------------------------------------------------------------------------

export const communities = pgTable("community", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),
  name: t.varchar({ length: 255 }).notNull(),
  slug: t.varchar({ length: 50 }).notNull().unique(), // for URLs: app.com/c/slug

  // GHL Integration Keys
  ghlLocationId: t.varchar({ length: 255 }).notNull().unique(),
  ghlAccessToken: t.text(), // Encrypt this in app logic!
  ghlRefreshToken: t.text(),
  ghlTokenExpiresAt: t.timestamp(),

  // Customization
  themeColor: t.varchar({ length: 7 }).default("#000000"),
  logoUrl: t.text(),

  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => sql`now()`),
}));

export const CreateCommunitySchema = createInsertSchema(communities, {
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  ghlLocationId: z.string().min(1).max(255),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const SelectCommunitySchema = createSelectSchema(communities);

// -----------------------------------------------------------------------------
// 2. MEMBERS (User-Community Join with Gamification)
// -----------------------------------------------------------------------------

export const members = pgTable(
  "member",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t.text().notNull(),
    communityId: t.uuid().notNull(),

    // GHL Contact Mapping
    ghlContactId: t.varchar({ length: 255 }), // The specific contact ID in this location
    ghlTags: t.jsonb().$type<string[]>().default([]), // Synced from GHL Webhooks

    // Gamification & Role
    role: t.varchar({ length: 20 }).default("member"), // 'owner', 'admin', 'moderator', 'member'
    level: t.integer().default(1),
    points: t.integer().default(0),

    joinedAt: t.timestamp().defaultNow().notNull(),
  }),
  (t) => [index("member_user_community_idx").on(t.userId, t.communityId)],
);

export const CreateMemberSchema = createInsertSchema(members, {
  role: z.enum(["owner", "admin", "moderator", "member"]).optional(),
}).omit({
  id: true,
  joinedAt: true,
});

export const SelectMemberSchema = createSelectSchema(members);

// -----------------------------------------------------------------------------
// 3. SOCIAL ENGINE (Channels, Posts, Comments, Likes)
// -----------------------------------------------------------------------------

export const channels = pgTable("channel", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),
  communityId: t.uuid().notNull(),
  name: t.varchar({ length: 100 }).notNull(),
  description: t.text(),
  icon: t.varchar({ length: 50 }), // lucide-react icon name
  isPrivate: t.boolean().default(false),

  // Permissions: Which GHL tags can view/post?
  requiredGhlTags: t.jsonb().$type<string[]>().default([]),

  position: t.integer().default(0),
  createdAt: t.timestamp().defaultNow(),
}));

export const CreateChannelSchema = createInsertSchema(channels, {
  name: z.string().min(1).max(100),
  icon: z.string().max(50).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const SelectChannelSchema = createSelectSchema(channels);

export const posts = pgTable("post", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),
  communityId: t.uuid().notNull(),
  channelId: t.uuid().notNull(),
  authorId: t.uuid().notNull(),

  title: t.varchar({ length: 255 }).notNull(),
  content: t.text(), // Rich text or Markdown

  // Media Attachments
  mediaUrl: t.text(),
  mediaType: t.varchar({ length: 20 }), // 'image', 'video', 'audio' (voice note)

  isPinned: t.boolean().default(false),
  commentCount: t.integer().default(0),
  likeCount: t.integer().default(0),

  createdAt: t.timestamp().defaultNow(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(posts, {
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  mediaType: z.enum(["image", "video", "audio"]).optional(),
}).omit({
  id: true,
  commentCount: true,
  likeCount: true,
  createdAt: true,
  updatedAt: true,
});

export const SelectPostSchema = createSelectSchema(posts);

export const comments = pgTable("comment", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),
  postId: t.uuid().notNull(),
  authorId: t.uuid().notNull(),
  parentId: t.uuid(), // For nested replies

  content: t.text(),
  voiceNoteUrl: t.text(), // Specific field for voice feature

  createdAt: t.timestamp().defaultNow(),
}));

export const CreateCommentSchema = createInsertSchema(comments, {
  content: z.string().optional(),
  voiceNoteUrl: z.url().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const SelectCommentSchema = createSelectSchema(comments);

export const likes = pgTable(
  "like",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),
    postId: t.uuid(),
    commentId: t.uuid(),
    memberId: t.uuid().notNull(),
    createdAt: t.timestamp().defaultNow(),
  }),
  (t) => [index("like_post_member_idx").on(t.postId, t.memberId)],
);

export const CreateLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

// -----------------------------------------------------------------------------
// 4. LMS ENGINE (Courses, Modules, Lessons, Progress)
// -----------------------------------------------------------------------------

export const courses = pgTable("course", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),
  communityId: t.uuid().notNull(),
  title: t.varchar({ length: 255 }).notNull(),
  description: t.text(),
  thumbnailUrl: t.text(),
  published: t.boolean().default(false),

  // Unlocking Logic
  unlockGhlTag: t.varchar({ length: 255 }), // e.g., "purchased-course-a"
  unlockLevel: t.integer(), // Gamification unlock

  position: t.integer().default(0),
  createdAt: t.timestamp().defaultNow(),
}));

export const CreateCourseSchema = createInsertSchema(courses, {
  title: z.string().min(1).max(255),
}).omit({
  id: true,
  createdAt: true,
});

export const SelectCourseSchema = createSelectSchema(courses);

export const modules = pgTable("module", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),
  courseId: t.uuid().notNull(),
  title: t.varchar({ length: 255 }).notNull(),
  position: t.integer().default(0),
}));

export const CreateModuleSchema = createInsertSchema(modules, {
  title: z.string().min(1).max(255),
}).omit({
  id: true,
});

export const SelectModuleSchema = createSelectSchema(modules);

export const lessons = pgTable("lesson", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),
  moduleId: t.uuid().notNull(),
  title: t.varchar({ length: 255 }).notNull(),

  // Content
  videoUrl: t.text(), // Mux, Vimeo, or YouTube link
  content: t.text(), // Text description/resources
  isPreview: t.boolean().default(false), // Allow viewing without unlock?

  position: t.integer().default(0),
}));

export const CreateLessonSchema = createInsertSchema(lessons, {
  title: z.string().min(1).max(255),
}).omit({
  id: true,
});

export const SelectLessonSchema = createSelectSchema(lessons);

export const userProgress = pgTable(
  "user_progress",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),
    memberId: t.uuid().notNull(),
    lessonId: t.uuid().notNull(),
    completedAt: t.timestamp().defaultNow(),
  }),
  (t) => [index("progress_member_lesson_idx").on(t.memberId, t.lessonId)],
);

export const CreateProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  completedAt: true,
});

// -----------------------------------------------------------------------------
// 5. RELATIONS (For Drizzle Query API)
// -----------------------------------------------------------------------------

export const communitiesRelations = relations(communities, ({ many }) => ({
  members: many(members),
  channels: many(channels),
  courses: many(courses),
  posts: many(posts),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(communities, {
    fields: [members.communityId],
    references: [communities.id],
  }),
  community: one(communities, {
    fields: [members.communityId],
    references: [communities.id],
  }),
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  progress: many(userProgress),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  community: one(communities, {
    fields: [channels.communityId],
    references: [communities.id],
  }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  community: one(communities, {
    fields: [posts.communityId],
    references: [communities.id],
  }),
  channel: one(channels, {
    fields: [posts.channelId],
    references: [channels.id],
  }),
  author: one(members, {
    fields: [posts.authorId],
    references: [members.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(members, {
    fields: [comments.authorId],
    references: [members.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
  member: one(members, {
    fields: [likes.memberId],
    references: [members.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  community: one(communities, {
    fields: [courses.communityId],
    references: [communities.id],
  }),
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  progress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  member: one(members, {
    fields: [userProgress.memberId],
    references: [members.id],
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id],
  }),
}));
