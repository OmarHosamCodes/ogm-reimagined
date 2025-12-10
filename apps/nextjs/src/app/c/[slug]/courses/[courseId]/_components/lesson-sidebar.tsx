"use client";

import { cn } from "@ogm/ui";
import { Check, Play } from "lucide-react";
import Link from "next/link";

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  isPreview: boolean | null;
  isCompleted?: boolean;
}

interface LessonSidebarProps {
  courseId: string;
  modules: Module[];
  currentLessonId: string | null;
}

export function LessonSidebar({
  courseId,
  modules,
  currentLessonId,
}: LessonSidebarProps) {
  return (
    <aside className="w-72 shrink-0">
      <div className="sticky top-6 space-y-4 rounded-lg border p-4">
        <h3 className="font-semibold">Course Content</h3>
        <nav className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <div key={module.id}>
              <h4 className="text-sm font-medium text-muted-foreground">
                Module {moduleIndex + 1}: {module.title}
              </h4>
              <ul className="mt-2 space-y-1">
                {module.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id}>
                    <Link
                      href={`${courseId}/${lesson.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
                        currentLessonId === lesson.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className="flex h-5 w-5 items-center justify-center">
                        {lesson.isCompleted ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </span>
                      <span className="flex-1 truncate">{lesson.title}</span>
                      {lesson.isPreview && (
                        <span className="text-xs text-muted-foreground">
                          Free
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
