"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from "@ogm/ui";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

export function JoinCommunityDialog() {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const joinMutation = trpc.member.join.useMutation({
    onSuccess: () => {
      utils.auth.getUserCommunities.invalidate();
      setOpen(false);
      setSlug("");
    },
  });

  const handleJoin = async () => {
    if (!slug) return;

    setIsLoading(true);
    try {
      // First, get the community by slug
      const community = await trpc.community.getBySlug.query({ slug });

      // Then join it
      await joinMutation.mutateAsync({
        communityId: community.id,
      });
    } catch (error) {
      console.error("Failed to join community:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Join Community</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Community</DialogTitle>
          <DialogDescription>
            Enter the community slug or invite code to join.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Community Slug</Label>
            <Input
              id="slug"
              placeholder="my-community"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoin();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              The slug is the part after /c/ in the community URL
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!slug || isLoading}>
            {isLoading ? "Joining..." : "Join"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
