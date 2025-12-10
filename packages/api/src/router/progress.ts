import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq, sql } from "@ogm/db";
import { courses, lessons, members, userProgress } from "@ogm/db/schema";

import { protectedProcedure } from "../trpc";

export const progressRouter = {
  /**
   * Mark a lesson as complete
   */
  markComplete: protectedProcedure
    .input(z.object({ lessonId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get lesson to find community
      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.lessonId),
        with: {
          module: {
            with: { course: true },
          },
        },
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found",
        });
      }

      // Get member
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, lesson.module.course.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to track progress",
        });
      }

      // Check if already completed
      const existingProgress = await ctx.db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.memberId, member.id),
          eq(userProgress.lessonId, input.lessonId),
        ),
      });

      if (existingProgress) {
        return existingProgress;
      }

      // Create progress record
      const [progress] = await ctx.db
        .insert(userProgress)
        .values({
          memberId: member.id,
          lessonId: input.lessonId,
        })
        .returning();

      // Award points for completing a lesson
      await ctx.db
        .update(members)
        .set({
          points: sql`${members.points} + 10`,
        })
        .where(eq(members.id, member.id));

      return progress;
    }),

  /**
   * Mark a lesson as incomplete
   */
  markIncomplete: protectedProcedure
    .input(z.object({ lessonId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get lesson to find community
      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.lessonId),
        with: {
          module: {
            with: { course: true },
          },
        },
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found",
        });
      }

      // Get member
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, lesson.module.course.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to track progress",
        });
      }

      // Delete progress record
      await ctx.db
        .delete(userProgress)
        .where(
          and(
            eq(userProgress.memberId, member.id),
            eq(userProgress.lessonId, input.lessonId),
          ),
        );

      return { success: true };
    }),

  /**
   * Get progress for a course
   */
  getCourseProgress: protectedProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get course with lessons
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId),
        with: {
          modules: {
            with: {
              lessons: true,
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

      // Get member
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, course.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to view progress",
        });
      }

      // Get all lesson IDs
      const lessonIds = course.modules.flatMap((m) =>
        m.lessons.map((l) => l.id),
      );

      if (lessonIds.length === 0) {
        return {
          totalLessons: 0,
          completedLessons: 0,
          percentComplete: 0,
          lessons: [],
        };
      }

      // Get completed lessons
      const progress = await ctx.db.query.userProgress.findMany({
        where: and(
          eq(userProgress.memberId, member.id),
          sql`${userProgress.lessonId} = ANY(${lessonIds})`,
        ),
      });

      const completedLessonIds = new Set(progress.map((p) => p.lessonId));

      return {
        totalLessons: lessonIds.length,
        completedLessons: completedLessonIds.size,
        percentComplete: Math.round(
          (completedLessonIds.size / lessonIds.length) * 100,
        ),
        lessons: lessonIds.map((id) => ({
          lessonId: id,
          isCompleted: completedLessonIds.has(id),
        })),
      };
    }),

  /**
   * Get all progress for a member (across all courses)
   */
  getMemberProgress: protectedProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get member
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to view progress",
        });
      }

      // Get all progress
      const progress = await ctx.db.query.userProgress.findMany({
        where: eq(userProgress.memberId, member.id),
        with: {
          lesson: {
            with: {
              module: {
                with: {
                  course: true,
                },
              },
            },
          },
        },
      });

      // Group by course
      const courseProgress = new Map<
        string,
        {
          courseId: string;
          courseTitle: string;
          completedLessons: number;
          totalLessons: number;
        }
      >();

      for (const p of progress) {
        const courseId = p.lesson.module.course.id;
        const existing = courseProgress.get(courseId);

        if (existing) {
          existing.completedLessons += 1;
        } else {
          // We need to count total lessons for this course
          const courseData = await ctx.db.query.courses.findFirst({
            where: eq(courses.id, courseId),
            with: {
              modules: {
                with: {
                  lessons: true,
                },
              },
            },
          });

          const totalLessons =
            courseData?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ??
            0;

          courseProgress.set(courseId, {
            courseId,
            courseTitle: p.lesson.module.course.title,
            completedLessons: 1,
            totalLessons,
          });
        }
      }

      return Array.from(courseProgress.values()).map((cp) => ({
        ...cp,
        percentComplete: Math.round(
          (cp.completedLessons / cp.totalLessons) * 100,
        ),
      }));
    }),
} satisfies TRPCRouterRecord;
