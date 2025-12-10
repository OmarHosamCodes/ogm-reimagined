"use client";

import { Button, Input, Label } from "@ogm/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, GripVertical, Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean | null;
  position: number | null;
}

interface ChannelManagerProps {
  communityId: string;
  channels: Channel[];
}

export function ChannelManager({ communityId, channels }: ChannelManagerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  const createChannel = useMutation(
    trpc.channel.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        setIsAdding(false);
        setNewName("");
        setNewDescription("");
        setNewIsPrivate(false);
      },
    }),
  );

  const deleteChannel = useMutation(
    trpc.channel.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createChannel.mutate({
      communityId,
      name: newName,
      description: newDescription || undefined,
      isPrivate: newIsPrivate,
    });
  };

  const handleDelete = (channelId: string) => {
    if (confirm("Are you sure you want to delete this channel?")) {
      deleteChannel.mutate({ id: channelId });
    }
  };

  const sortedChannels = [...channels].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  return (
    <div className="space-y-4">
      {/* Channel list */}
      <div className="space-y-2">
        {sortedChannels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium"># {channel.name}</span>
                {channel.isPrivate ? (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Globe className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              {channel.description && (
                <p className="text-sm text-muted-foreground">
                  {channel.description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(channel.id)}
              disabled={deleteChannel.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        {channels.length === 0 && !isAdding && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No channels yet. Create one to get started.
          </p>
        )}
      </div>

      {/* Add channel form */}
      {isAdding ? (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border p-4"
        >
          <div className="space-y-2">
            <Label htmlFor="channelName">Channel Name</Label>
            <Input
              id="channelName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="general"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channelDescription">Description (optional)</Label>
            <Input
              id="channelDescription"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="A place for general discussions"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="channelPrivate"
              checked={newIsPrivate}
              onChange={(e) => setNewIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            <Label htmlFor="channelPrivate">Private channel</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createChannel.isPending}>
              {createChannel.isPending ? "Creating..." : "Create Channel"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
          </div>

          {createChannel.error && (
            <p className="text-sm text-destructive">
              {createChannel.error.message}
            </p>
          )}
        </form>
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      )}
    </div>
  );
}
