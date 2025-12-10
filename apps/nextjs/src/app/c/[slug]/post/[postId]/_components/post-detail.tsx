"use client";

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

import { Button } from "@ogm/ui/button";

interface Post {
  id: string;
  content: string;
  imageUrls: string[] | null;
  isPinned: boolean | null;
  createdAt: Date;
  author: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
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
            {post.author?.user?.image ? (
              <img
                src={post.author.user.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {post.author?.user?.name?.[0] ?? "?"}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold">
              {post.author?.user?.name ?? "Anonymous"}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <time>{new Date(post.createdAt).toLocaleDateString()}</time>
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

      {/* Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="mt-4 grid gap-2">
          {post.imageUrls.length === 1 ? (
            <img
              src={post.imageUrls[0]}
              alt=""
              className="w-full rounded-lg object-cover max-h-96"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {post.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt=""
                  className="w-full h-48 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
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
