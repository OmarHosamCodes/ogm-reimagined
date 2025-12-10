import { Skeleton } from "@ogm/ui";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CommunitiesList } from "./_components/communities-list";
import { JoinCommunityDialog } from "./_components/join-community-dialog";

export default async function HomePage() {
  const session = await getSession();

  // Redirect to signin if not authenticated
  if (!session) {
    redirect("/signin");
  }

  // Prefetch user's communities
  prefetch(trpc.auth.getUserCommunities.queryOptions());

  return (
    <HydrateClient>
      <main className="container min-h-screen py-16">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">My Communities</h1>
              <p className="mt-2 text-muted-foreground">
                Welcome back, {session.user.name ?? session.user.email}
              </p>
            </div>
            <JoinCommunityDialog />
          </div>

          {/* Communities List */}
          <Suspense
            fallback={
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            }
          >
            <CommunitiesList />
          </Suspense>
        </div>
      </main>
    </HydrateClient>
  );
}
