"use client";

import { Button } from "@ogm/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useTRPC } from "~/trpc/react";

interface Post {
  id: string;
  title: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  isPinned: boolean | null;
  likeCount: number | null;
  commentCount: number | null;
  createdAt: Date | null;
  author: {
    id: string;
    role: string | null;
    level: number | null;
    user?: {
      name: string;
      image: string | null;
    } | null;
  };
  hasLiked?: boolean;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const toggleLike = useMutation(
    trpc.like.toggle.mutationOptions({
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleLike = () => {
    toggleLike.mutate({ postId: post.id });
  };

  const authorName = post.author.user?.name ?? "Anonymous";
  const authorImage = post.author.user?.image;
  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  return (
    <article className="rounded-lg border p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {authorImage ? (
            <img
              src={authorImage}
              alt={authorName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{authorName}</span>
              {post.author.level && post.author.level > 1 && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  Lvl {post.author.level}
                </span>
              )}
              {post.isPinned && (
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600">
                  Pinned
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold">{post.title}</h3>
        {post.content && (
          <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="mt-4">
          {post.mediaType === "image" && (
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="max-h-96 w-full rounded-lg object-cover"
            />
          )}
          {post.mediaType === "video" && (
            <video
              src={post.mediaUrl}
              controls
              className="max-h-96 w-full rounded-lg"
            />
          )}
          {post.mediaType === "audio" && (
            <audio src={post.mediaUrl} controls className="w-full" />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-4 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className={post.hasLiked ? "text-red-500" : ""}
          onClick={handleLike}
          disabled={toggleLike.isPending}
        >
          <Heart
            className={`mr-1 h-4 w-4 ${post.hasLiked ? "fill-current" : ""}`}
          />
          {post.likeCount ?? 0}
        </Button>
        <Link href={`/post/${post.id}`}>
          <Button variant="ghost" size="sm">
            <MessageCircle className="mr-1 h-4 w-4" />
            {post.commentCount ?? 0}
          </Button>
        </Link>
      </div>
    </article>
  );
}
