import { notFound } from "next/navigation";

import { desc, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities, members } from "@ogm/db/schema";

interface LeaderboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LeaderboardPage({
  params,
}: LeaderboardPageProps) {
  const { slug } = await params;

  const community = await db.query.communities.findFirst({
    where: eq(communities.slug, slug),
  });

  if (!community) {
    notFound();
  }

  const leaderboard = await db.query.members.findMany({
    where: eq(members.communityId, community.id),
    orderBy: [desc(members.points)],
    limit: 50,
    with: {
      user: true,
    },
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `${rank}`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top contributors in the community.
        </p>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((member, index) => {
          const position = index + 1;
          const isFirst = position === 1;

          return (
            <div
              key={member.id}
              className={`flex flex-col items-center rounded-lg border p-6 ${
                isFirst
                  ? "order-first col-start-2 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-transparent"
                  : ""
              }`}
            >
              <span className="text-4xl">{getRankIcon(position)}</span>
              <div className="mt-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {member.user?.image ? (
                  <img
                    src={member.user.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {member.user?.name?.[0] ?? "?"}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold">
                {member.user?.name ?? "Anonymous"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Level {member.level}
              </p>
              <p className="mt-2 text-lg font-bold text-primary">
                {member.points?.toLocaleString()} pts
              </p>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left text-sm font-medium w-16">Rank</th>
              <th className="p-3 text-left text-sm font-medium">Member</th>
              <th className="p-3 text-left text-sm font-medium">Level</th>
              <th className="p-3 text-right text-sm font-medium">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leaderboard.slice(3).map((member, index) => (
              <tr key={member.id} className="hover:bg-muted/30">
                <td className="p-3 text-muted-foreground">{index + 4}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {member.user?.image ? (
                        <img
                          src={member.user.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {member.user?.name?.[0] ?? "?"}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">
                      {member.user?.name ?? "Anonymous"}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-sm text-primary">
                    Level {member.level}
                  </span>
                </td>
                <td className="p-3 text-right font-semibold">
                  {member.points?.toLocaleString()}
                </td>
              </tr>
            ))}

            {leaderboard.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-muted-foreground"
                >
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
