"use client";

import { Button } from "@ogm/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Heart,
    MessageCircle,
    MoreHorizontal,
    Pin,
    Share2,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

interface Post {
  id: string;
  title: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  isPinned: boolean | null;
  createdAt: Date | null;
  author: {
    user: {
      id: string;
      name: string | null;
    } | null;
  } | null;
  channel: {
    id: string;
    name: string;
  } | null;
}

interface PostDetailProps {
  post: Post;
}

export function PostDetail({ post }: PostDetailProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);

  const toggleLike = useMutation(
    trpc.like.toggle.mutationOptions({
      onSuccess: () => {
        setIsLiked(!isLiked);
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Check out this post",
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <article className="rounded-lg border bg-card p-6">
      {/* Pinned badge */}
      {post.isPinned && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Pin className="h-4 w-4" />
          <span>Pinned post</span>
        </div>
      )}

      {/* Author */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            <span className="text-sm font-semibold text-muted-foreground">
              {post.author?.user?.name?.[0] ?? "?"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold">
              {post.author?.user?.name ?? "Anonymous"}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <time>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</time>
              {post.channel && (
                <>
                  <span>•</span>
                  <span>#{post.channel.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="mt-4">
        <p className="text-lg whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="mt-4">
          {post.mediaType?.startsWith("image") ? (
            <img
              src={post.mediaUrl}
              alt=""
              className="w-full rounded-lg object-cover max-h-96"
            />
          ) : post.mediaType?.startsWith("video") ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full rounded-lg max-h-96"
            />
          ) : post.mediaType?.startsWith("audio") ? (
            <audio
              src={post.mediaUrl}
              controls
              className="w-full"
            />
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center gap-4 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleLike.mutate({ postId: post.id })}
          className={isLiked ? "text-primary" : ""}
        >
          <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          Like
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="mr-2 h-4 w-4" />
          Comment
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </article>
  );
}
