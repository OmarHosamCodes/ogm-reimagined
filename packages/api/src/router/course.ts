import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, asc, eq } from "@ogm/db";
import {
  CreateCourseSchema,
  courses,
  lessons,
  members,
  modules,
  userProgress,
} from "@ogm/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const courseRouter = {
  /**
   * Create a new course
   */
  create: protectedProcedure
    .input(CreateCourseSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create courses",
        });
      }

      // Get max position
      const existingCourses = await ctx.db.query.courses.findMany({
        where: eq(courses.communityId, input.communityId),
        orderBy: asc(courses.position),
      });

      const maxPosition =
        existingCourses.length > 0
          ? Math.max(...existingCourses.map((c) => c.position ?? 0))
          : 0;

      const [course] = await ctx.db
        .insert(courses)
        .values({
          ...input,
          position: maxPosition + 1,
        })
        .returning();

      return course;
    }),

  /**
   * List courses for a community (respects unlock logic)
   */
  list: publicProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const courseList = await ctx.db.query.courses.findMany({
        where: eq(courses.communityId, input.communityId),
        orderBy: asc(courses.position),
      });

      // If user is logged in, check unlock status
      if (ctx.session?.user) {
        const member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, input.communityId),
          ),
        });

        if (member) {
          const memberTags = (member.ghlTags as string[]) ?? [];
          const memberLevel = member.level ?? 1;

          return courseList.map((course) => ({
            ...course,
            isUnlocked: checkCourseUnlock(course, memberTags, memberLevel),
          }));
        }
      }

      // Non-authenticated users see all as locked
      return courseList.map((course) => ({
        ...course,
        isUnlocked: !course.unlockGhlTag && !course.unlockLevel,
      }));
    }),

  /**
   * Get course by ID with modules and lessons
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.id),
        with: {
          modules: {
            orderBy: asc(modules.position),
            with: {
              lessons: {
                orderBy: asc(lessons.position),
              },
            },
          },
        },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check unlock status
      let isUnlocked = !course.unlockGhlTag && !course.unlockLevel;
      let progress: { lessonId: string; completedAt: Date | null }[] = [];

      if (ctx.session?.user) {
        const member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, course.communityId),
          ),
        });

        if (member) {
          const memberTags = (member.ghlTags as string[]) ?? [];
          const memberLevel = member.level ?? 1;
          isUnlocked = checkCourseUnlock(course, memberTags, memberLevel);

          // Get progress for this course
          const lessonIds = course.modules.flatMap((m) =>
            m.lessons.map((l) => l.id),
          );

          if (lessonIds.length > 0) {
            progress = await ctx.db.query.userProgress.findMany({
              where: and(eq(userProgress.memberId, member.id)),
            });
          }
        }
      }

      const progressMap = new Map(
        progress.map((p) => [p.lessonId, p.completedAt]),
      );

      return {
        ...course,
        isUnlocked,
        modules: course.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => ({
            ...lesson,
            isCompleted: progressMap.has(lesson.id),
            completedAt: progressMap.get(lesson.id) ?? null,
          })),
        })),
      };
    }),

  /**
   * Update a course
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        thumbnailUrl: z.url().optional(),
        unlockGhlTag: z.string().optional(),
        unlockLevel: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, id),
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this course",
        });
      }

      const [updated] = await ctx.db
        .update(courses)
        .set(data)
        .where(eq(courses.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete a course
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.id),
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this course",
        });
      }

      await ctx.db.delete(courses).where(eq(courses.id, input.id));

      return { success: true };
    }),

  /**
   * Publish/unpublish a course
   */
  publish: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        published: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.id),
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to publish courses",
        });
      }

      const [updated] = await ctx.db
        .update(courses)
        .set({ published: input.published })
        .where(eq(courses.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Reorder courses
   */
  reorder: protectedProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        courseIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to reorder courses",
        });
      }

      // Update positions
      await Promise.all(
        input.courseIds.map((id, index) =>
          ctx.db
            .update(courses)
            .set({ position: index })
            .where(eq(courses.id, id)),
        ),
      );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;

/**
 * Check if a course is unlocked for a member
 */
function checkCourseUnlock(
  course: { unlockGhlTag: string | null; unlockLevel: number | null },
  memberTags: string[],
  memberLevel: number,
): boolean {
  // If no unlock requirements, it's unlocked
  if (!course.unlockGhlTag && !course.unlockLevel) {
    return true;
  }

  // Check tag unlock
  if (course.unlockGhlTag && memberTags.includes(course.unlockGhlTag)) {
    return true;
  }

  // Check level unlock
  if (course.unlockLevel && memberLevel >= course.unlockLevel) {
    return true;
  }

  return false;
}
