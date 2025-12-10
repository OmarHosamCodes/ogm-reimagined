"use client";

import { Button, Input, Label } from "@ogm/ui";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

export default function NewCommunityPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const createCommunity = useMutation(
    trpc.community.create.mutationOptions({
      onSuccess: (community) => {
        router.push(`/admin/communities/${community.id}`);
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCommunity.mutate({ name, slug, ghlLocationId: "" });
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Community</h1>
        <p className="text-muted-foreground">
          Set up a new community for your members.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Community Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Awesome Community"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">/c/</span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-community"
              pattern="[a-z0-9-]+"
              required
            />
          </div>
          <p className="text-sm text-muted-foreground">
            This will be the URL of your community.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is your community about?"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={createCommunity.isPending}>
            {createCommunity.isPending ? "Creating..." : "Create Community"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {createCommunity.error && (
          <p className="text-sm text-destructive">
            {createCommunity.error.message}
          </p>
        )}
      </form>
    </div>
  );
}
