"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ogm/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useTRPC } from "~/trpc/react";

export function CommunitiesList() {
  const trpc = useTRPC();

  const { data: communities } = useSuspenseQuery(
    trpc.auth.getUserCommunities.queryOptions(),
  );

  if (communities.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No communities yet</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Join a community to get started with courses, discussions, and more.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Join Community
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <Link key={community.id} href={`/c/${community.slug}`}>
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {community.logoUrl ? (
                    <img
                      src={community.logoUrl}
                      alt={community.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg font-bold text-white"
                      style={{
                        backgroundColor: community.themeColor ?? "#6366f1",
                      }}
                    >
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{community.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {community.membership.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{community.stats.memberCount} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{community.stats.channelCount} channels</span>
                </div>
              </div>
              {community.membership.level && community.membership.level > 1 && (
                <div className="mt-3 text-sm">
                  <span className="font-medium">
                    Level {community.membership.level}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    • {community.membership.points} points
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
