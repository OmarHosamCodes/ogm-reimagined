import { notFound } from "next/navigation";

import { asc, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { courses, lessons, modules } from "@ogm/db/schema";

import { LessonSidebar } from "./_components/lesson-sidebar";

interface CoursePageProps {
  params: Promise<{ slug: string; courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug, courseId } = await params;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
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
  });

  if (!course) {
    notFound();
  }

  // Verify course belongs to this community
  if (course.community.slug !== slug) {
    notFound();
  }

  // Get the first lesson for preview
  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 space-y-6">
        {/* Course header */}
        <div>
          {course.thumbnailUrl && (
            <div className="aspect-video overflow-hidden rounded-lg mb-4">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="mt-2 text-muted-foreground">{course.description}</p>
          )}
        </div>

        {/* Course content overview */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Course Content</h2>
          <div className="mt-4 space-y-4">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id}>
                <h3 className="font-medium">
                  {moduleIndex + 1}. {module.title}
                </h3>
                <ul className="mt-2 space-y-1 pl-4">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={lesson.id}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="w-6">
                        {moduleIndex + 1}.{lessonIndex + 1}
                      </span>
                      {lesson.title}
                      {lesson.isPreview && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          Preview
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Start course button */}
        {firstLesson && (
          <div className="flex justify-center">
            <a
              href={`courses/${courseId}/${firstLesson.id}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Course
            </a>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <LessonSidebar
        courseId={courseId}
        modules={course.modules}
        currentLessonId={null}
      />
    </div>
  );
}
