"use client";

import { Button, Input, Label } from "@ogm/ui";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

export default function NewCoursePage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [unlockTagIds, setUnlockTagIds] = useState("");

  // Get list of communities
  const { data: communities } = useSuspenseQuery(
    trpc.community.listMine.queryOptions(),
  );

  const createCourse = useMutation(
    trpc.course.create.mutationOptions({
      onSuccess: (course) => {
        router.push(`/admin/courses/${course.id}`);
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCourse.mutate({
      communityId,
      title,
      description: description || undefined,
      unlockTagIds: unlockTagIds
        ? unlockTagIds.split(",").map((id) => id.trim())
        : undefined,
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Course</h1>
        <p className="text-muted-foreground">
          Set up a new learning course for your community.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="community">Community</Label>
          <select
            id="community"
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Select a community</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Course Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Introduction to..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will students learn in this course?"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unlockTagIds">Unlock Tag IDs (optional)</Label>
          <Input
            id="unlockTagIds"
            value={unlockTagIds}
            onChange={(e) => setUnlockTagIds(e.target.value)}
            placeholder="tag-id-1, tag-id-2"
          />
          <p className="text-sm text-muted-foreground">
            Comma-separated GHL tag IDs. Users with these tags will have access
            to the course.
          </p>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={createCourse.isPending}>
            {createCourse.isPending ? "Creating..." : "Create Course"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {createCourse.error && (
          <p className="text-sm text-destructive">
            {createCourse.error.message}
          </p>
        )}
      </form>
    </div>
  );
}
