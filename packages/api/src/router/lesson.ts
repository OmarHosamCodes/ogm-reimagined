import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, asc, eq } from "@ogm/db";
import { CreateLessonSchema, lessons, members, modules } from "@ogm/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const lessonRouter = {
  /**
   * Create a new lesson
   */
  create: protectedProcedure
    .input(CreateLessonSchema)
    .mutation(async ({ ctx, input }) => {
      // Get module to find course and community
      const module = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, input.moduleId),
        with: { course: true },
      });

      if (!module) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, module.course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create lessons",
        });
      }

      // Get max position
      const existingLessons = await ctx.db.query.lessons.findMany({
        where: eq(lessons.moduleId, input.moduleId),
        orderBy: asc(lessons.position),
      });

      const maxPosition =
        existingLessons.length > 0
          ? Math.max(...existingLessons.map((l) => l.position ?? 0))
          : 0;

      const [lesson] = await ctx.db
        .insert(lessons)
        .values({
          ...input,
          position: maxPosition + 1,
        })
        .returning();

      return lesson;
    }),

  /**
   * Get lesson by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.id),
        with: {
          module: {
            with: {
              course: true,
            },
          },
        },
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found",
        });
      }

      // Check if user has access (course is unlocked or lesson is preview)
      if (!lesson.isPreview) {
        if (!ctx.session?.user) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must be logged in to view this lesson",
          });
        }

        const member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, lesson.module.course.communityId),
          ),
        });

        if (!member) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must be a member to view this lesson",
          });
        }

        // Check course unlock
        const course = lesson.module.course;
        const memberTags = (member.ghlTags as string[]) ?? [];
        const memberLevel = member.level ?? 1;

        const isUnlocked =
          (!course.unlockGhlTag && !course.unlockLevel) ||
          (course.unlockGhlTag && memberTags.includes(course.unlockGhlTag)) ||
          (course.unlockLevel && memberLevel >= course.unlockLevel);

        if (!isUnlocked && !["owner", "admin"].includes(member.role ?? "")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this lesson",
          });
        }
      }

      return lesson;
    }),

  /**
   * Update a lesson
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        videoUrl: z.url().optional(),
        content: z.string().optional(),
        isPreview: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, id),
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

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, lesson.module.course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this lesson",
        });
      }

      const [updated] = await ctx.db
        .update(lessons)
        .set(data)
        .where(eq(lessons.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete a lesson
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.id),
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

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, lesson.module.course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this lesson",
        });
      }

      await ctx.db.delete(lessons).where(eq(lessons.id, input.id));

      return { success: true };
    }),

  /**
   * Reorder lessons
   */
  reorder: protectedProcedure
    .input(
      z.object({
        moduleId: z.string().uuid(),
        lessonIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get module to find community
      const module = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, input.moduleId),
        with: { course: true },
      });

      if (!module) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, module.course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to reorder lessons",
        });
      }

      // Update positions
      await Promise.all(
        input.lessonIds.map((id, index) =>
          ctx.db
            .update(lessons)
            .set({ position: index })
            .where(eq(lessons.id, id)),
        ),
      );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
