/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod/v4";

import type { Auth } from "@ogm/auth";
import { and, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { channels, courses, members } from "@ogm/db/schema";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: Auth;
}) => {
  const authApi = opts.auth.api;
  const session = await authApi.getSession({
    headers: opts.headers,
  });
  return {
    authApi,
    session,
    db,
  };
};
/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an articifial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Member procedure
 *
 * Requires authentication AND membership in a specific community.
 * The communityId must be provided in the input.
 * Adds `member` to the context with the user's membership info.
 */
export const memberProcedure = protectedProcedure
  .input(z.object({ communityId: z.string().uuid() }))
  .use(async ({ ctx, input, next }) => {
    const member = await ctx.db.query.members.findFirst({
      where: and(
        eq(members.userId, ctx.session.user.id),
        eq(members.communityId, input.communityId),
      ),
    });

    if (!member) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this community",
      });
    }

    return next({
      ctx: {
        ...ctx,
        member,
        communityId: input.communityId,
      },
    });
  });

/**
 * Admin procedure
 *
 * Requires authentication AND admin/owner role in the community.
 * The communityId must be provided in the input.
 */
export const adminProcedure = memberProcedure.use(({ ctx, next }) => {
  if (!["owner", "admin"].includes(ctx.member.role ?? "")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      isAdmin: true,
    },
  });
});

/**
 * Moderator procedure
 *
 * Requires authentication AND moderator/admin/owner role in the community.
 * The communityId must be provided in the input.
 */
export const moderatorProcedure = memberProcedure.use(({ ctx, next }) => {
  if (!["owner", "admin", "moderator"].includes(ctx.member.role ?? "")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Moderator access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      isModerator: true,
    },
  });
});

/**
 * Owner procedure
 *
 * Requires authentication AND owner role in the community.
 * The communityId must be provided in the input.
 */
export const ownerProcedure = memberProcedure.use(({ ctx, next }) => {
  if (ctx.member.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      isOwner: true,
    },
  });
});

/**
 * Helper: Check if member has access to a private channel based on GHL tags
 */
export async function checkChannelAccess(
  db: typeof import("@ogm/db/client").db,
  member: { role: string | null; ghlTags: unknown },
  channelId: string,
): Promise<boolean> {
  // Admins and moderators have access to all channels
  if (["owner", "admin", "moderator"].includes(member.role ?? "")) {
    return true;
  }

  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
  });

  if (!channel) {
    return false;
  }

  // Public channels are accessible to all members
  if (!channel.isPrivate) {
    return true;
  }

  // Check GHL tag requirements
  const requiredTags = (channel.requiredGhlTags as string[]) ?? [];
  if (requiredTags.length === 0) {
    return true;
  }

  const memberTags = (member.ghlTags as string[]) ?? [];
  return requiredTags.some((tag) => memberTags.includes(tag));
}

/**
 * Helper: Check if member has access to a course based on unlock conditions
 */
export async function checkCourseAccess(
  db: typeof import("@ogm/db/client").db,
  member: { role: string | null; ghlTags: unknown; level: number | null },
  courseId: string,
): Promise<boolean> {
  // Admins have access to all courses
  if (["owner", "admin"].includes(member.role ?? "")) {
    return true;
  }

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) {
    return false;
  }

  // No unlock requirements
  if (!course.unlockGhlTag && !course.unlockLevel) {
    return true;
  }

  // Check GHL tag unlock
  if (course.unlockGhlTag) {
    const memberTags = (member.ghlTags as string[]) ?? [];
    if (memberTags.includes(course.unlockGhlTag)) {
      return true;
    }
  }

  // Check level unlock
  if (course.unlockLevel) {
    const memberLevel = member.level ?? 1;
    if (memberLevel >= course.unlockLevel) {
      return true;
    }
  }

  return false;
}
