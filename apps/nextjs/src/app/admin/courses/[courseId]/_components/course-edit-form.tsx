"use client";

import { Button, Input, Label } from "@ogm/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  published: boolean | null;
  unlockGhlTag: string | null;
}

interface CourseEditFormProps {
  course: Course;
}

export function CourseEditForm({ course }: CourseEditFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl ?? "");
  const [unlockTagIds, setUnlockTagIds] = useState(course.unlockGhlTag ?? "");
  const [published, setPublished] = useState(course.published ?? false);

  const updateCourse = useMutation(
    trpc.course.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourse.mutate({
      id: course.id,
      title,
      description: description || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      unlockGhlTag: unlockTagIds || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Course Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
        <Input
          id="thumbnailUrl"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unlockTagIds">Unlock Tag IDs</Label>
        <Input
          id="unlockTagIds"
          value={unlockTagIds}
          onChange={(e) => setUnlockTagIds(e.target.value)}
          placeholder="tag-id-1, tag-id-2"
        />
        <p className="text-sm text-muted-foreground">
          Comma-separated GHL tag IDs for access control. Leave empty for public
          access.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border"
        />
        <Label htmlFor="published">Published</Label>
      </div>

      <Button type="submit" disabled={updateCourse.isPending}>
        {updateCourse.isPending ? "Saving..." : "Save Changes"}
      </Button>

      {updateCourse.isSuccess && (
        <p className="text-sm text-green-600">Changes saved successfully!</p>
      )}

      {updateCourse.error && (
        <p className="text-sm text-destructive">{updateCourse.error.message}</p>
      )}
    </form>
  );
}
