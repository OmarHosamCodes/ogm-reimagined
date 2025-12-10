"use client";

import { Button } from "@ogm/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTRPC } from "~/trpc/react";

interface Lesson {
  id: string;
  title: string;
  videoUrl: string | null;
  content: string | null;
  isPreview: boolean | null;
}

interface LessonContentProps {
  lesson: Lesson;
  courseId: string;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
}

export function LessonContent({
  lesson,
  courseId,
  prevLesson,
  nextLesson,
}: LessonContentProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const markComplete = useMutation(
    trpc.progress.markComplete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleMarkComplete = () => {
    markComplete.mutate({ lessonId: lesson.id });
  };

  return (
    <div className="space-y-6">
      {/* Video player */}
      {lesson.videoUrl && (
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          {lesson.videoUrl.includes("youtube.com") ||
          lesson.videoUrl.includes("youtu.be") ? (
            <iframe
              src={getYouTubeEmbedUrl(lesson.videoUrl)}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : lesson.videoUrl.includes("vimeo.com") ? (
            <iframe
              src={getVimeoEmbedUrl(lesson.videoUrl)}
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={lesson.videoUrl} controls className="h-full w-full" />
          )}
        </div>
      )}

      {/* Lesson header */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <Button
          onClick={handleMarkComplete}
          disabled={markComplete.isPending}
          variant="outline"
          className="shrink-0"
        >
          <Check className="mr-2 h-4 w-4" />
          {markComplete.isPending ? "Marking..." : "Mark Complete"}
        </Button>
      </div>

      {/* Lesson content */}
      {lesson.content && (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{lesson.content}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        {prevLesson ? (
          <Link href={`${courseId}/${prevLesson.id}`}>
            <Button variant="ghost">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {prevLesson.title}
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson && (
          <Link href={`${courseId}/${nextLesson.id}`}>
            <Button>
              {nextLesson.title}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  const videoId = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
  )?.[1];
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getVimeoEmbedUrl(url: string): string {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}
