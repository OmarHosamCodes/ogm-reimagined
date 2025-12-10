"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

import { Button } from "@ogm/ui/button";
import { Input } from "@ogm/ui/input";

interface PostComposerProps {
  channelId: string;
  communityId: string;
}

export function PostComposer({ channelId, communityId }: PostComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createPost = useMutation(
    trpc.post.create.mutationOptions({
      onSuccess: () => {
        setTitle("");
        setContent("");
        setIsExpanded(false);
        // Invalidate posts query
        queryClient.invalidateQueries({
          queryKey: trpc.post.listByChannel.queryKey({ channelId }),
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createPost.mutate({
      title: title.trim(),
      content: content.trim() || undefined,
      channelId,
      communityId,
      isPinned: false,
    });
  };

  if (!isExpanded) {
    return (
      <div
        className="cursor-pointer rounded-lg border p-4 hover:border-primary"
        onClick={() => setIsExpanded(true)}
      >
        <p className="text-muted-foreground">What's on your mind?</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-0 text-lg font-semibold focus-visible:ring-0"
      />
      <textarea
        placeholder="Write your post content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] w-full resize-none border-0 bg-transparent focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">{/* TODO: Add media upload buttons */}</div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsExpanded(false);
              setTitle("");
              setContent("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!title.trim() || createPost.isPending}
          >
            {createPost.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
