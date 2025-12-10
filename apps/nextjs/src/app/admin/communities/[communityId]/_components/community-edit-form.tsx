"use client";

import { Button, Input, Label } from "@ogm/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface CommunityEditFormProps {
  community: Community;
}

export function CommunityEditForm({ community }: CommunityEditFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [name, setName] = useState(community.name);
  const [logoUrl, setLogoUrl] = useState(community.logoUrl ?? "");

  const updateCommunity = useMutation(
    trpc.community.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommunity.mutate({
      id: community.id,
      name,
      logoUrl: logoUrl || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Community Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={community.slug} disabled />
        <p className="text-sm text-muted-foreground">
          The slug cannot be changed after creation.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <Button type="submit" disabled={updateCommunity.isPending}>
        {updateCommunity.isPending ? "Saving..." : "Save Changes"}
      </Button>

      {updateCommunity.isSuccess && (
        <p className="text-sm text-green-600">Changes saved successfully!</p>
      )}

      {updateCommunity.error && (
        <p className="text-sm text-destructive">
          {updateCommunity.error.message}
        </p>
      )}
    </form>
  );
}
