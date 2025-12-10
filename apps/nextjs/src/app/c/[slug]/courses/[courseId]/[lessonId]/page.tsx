import { notFound } from "next/navigation";

import { asc, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { lessons, modules } from "@ogm/db/schema";

import { LessonSidebar } from "../_components/lesson-sidebar";
import { LessonContent } from "./_components/lesson-content";

interface LessonPageProps {
  params: Promise<{ slug: string; courseId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, courseId, lessonId } = await params;

  // Get lesson with full course structure
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      module: {
        with: {
          course: {
            with: {
              community: true,
              modules: {
                orderBy: [asc(modules.position)],
                with: {
                  lessons: {
                    orderBy: [asc(lessons.position)],
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  const course = lesson.module.course;

  // Verify lesson belongs to this community and course
  if (course.community.slug !== slug || course.id !== courseId) {
    notFound();
  }

  // Find next and previous lessons
  let prevLesson: { id: string; title: string } | null = null;
  let nextLesson: { id: string; title: string } | null = null;

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);

  if (currentIndex > 0) {
    const prev = allLessons[currentIndex - 1];
    if (prev) {
      prevLesson = { id: prev.id, title: prev.title };
    }
  }
  if (currentIndex < allLessons.length - 1) {
    const next = allLessons[currentIndex + 1];
    if (next) {
      nextLesson = { id: next.id, title: next.title };
    }
  }

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1">
        <LessonContent
          lesson={lesson}
          courseId={courseId}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
        />
      </div>

      {/* Sidebar */}
      <LessonSidebar
        courseId={courseId}
        modules={course.modules}
        currentLessonId={lessonId}
      />
    </div>
  );
}
