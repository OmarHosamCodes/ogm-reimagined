import { authRouter } from "./router/auth";
import { channelRouter } from "./router/channel";
import { commentRouter } from "./router/comment";
import { communityRouter } from "./router/community";
import { courseRouter } from "./router/course";
import { ghlRouter } from "./router/ghl";
import { lessonRouter } from "./router/lesson";
import { likeRouter } from "./router/like";
import { memberRouter } from "./router/member";
import { moduleRouter } from "./router/module";
import { postRouter } from "./router/post";
import { progressRouter } from "./router/progress";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  // Auth
  auth: authRouter,

  // Community & Members
  community: communityRouter,
  member: memberRouter,

  // Social Engine
  channel: channelRouter,
  post: postRouter,
  comment: commentRouter,
  like: likeRouter,

  // LMS Engine
  course: courseRouter,
  module: moduleRouter,
  lesson: lessonRouter,
  progress: progressRouter,

  // GHL Integration
  ghl: ghlRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
