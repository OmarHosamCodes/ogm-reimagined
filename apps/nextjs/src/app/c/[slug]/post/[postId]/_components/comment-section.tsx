"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

import { Button } from "@ogm/ui/button";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: comments, isLoading } = useQuery(
    trpc.comment.list.queryOptions({ postId }),
  );

  const createComment = useMutation(
    trpc.comment.create.mutationOptions({
      onSuccess: () => {
        setNewComment("");
        setReplyingTo(null);
        setReplyContent("");
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createComment.mutate({
        postId,
        content: newComment.trim(),
      });
    }
  };

  const handleReply = (parentId: string) => {
    if (replyContent.trim()) {
      createComment.mutate({
        postId,
        content: replyContent.trim(),
        parentId,
      });
    }
  };

  // Group comments by parent
  const topLevelComments = comments?.filter((c) => !c.parentId) ?? [];
  const repliesMap = new Map<string, typeof comments>();

  comments?.forEach((comment) => {
    if (comment.parentId) {
      const existing = repliesMap.get(comment.parentId) ?? [];
      repliesMap.set(comment.parentId, [...existing, comment]);
    }
  });

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">
        Comments ({comments?.length ?? 0})
      </h2>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-full border bg-muted/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          type="submit"
          size="sm"
          disabled={createComment.isPending || !newComment.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Comments list */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground">
            Loading comments...
          </p>
        ) : topLevelComments.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Main comment */}
              <div className="flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {comment.author?.user?.image ? (
                    <img
                      src={comment.author.user.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {comment.author?.user?.name?.[0] ?? "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.author?.user?.name ?? "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{comment.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id,
                      )
                    }
                    className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reply
                  </button>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 rounded-full border bg-muted/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={
                          createComment.isPending || !replyContent.trim()
                        }
                      >
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Replies */}
              {repliesMap.get(comment.id)?.map((reply) => (
                <div key={reply.id} className="flex gap-3 ml-11">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {reply.author?.user?.image ? (
                      <img
                        src={reply.author.user.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {reply.author?.user?.name?.[0] ?? "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {reply.author?.user?.name ?? "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
