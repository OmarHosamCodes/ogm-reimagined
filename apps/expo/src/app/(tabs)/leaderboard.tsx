import { useQuery } from "@tanstack/react-query";
import { Award, Medal, Trophy } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { trpc } from "~/utils/api";
import { useCommunity } from "~/utils/CommunityContext";

export default function LeaderboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { communityId } = useCommunity();

  const {
    data: members,
    isLoading,
    refetch,
  } = useQuery(
    trpc.member.leaderboard.queryOptions({
      communityId: communityId ?? "",
      limit: 50,
    }),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#c03484" />
      </View>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return (
          <Text className="w-6 text-center font-bold text-zinc-500">
            {rank}
          </Text>
        );
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <FlatList
        data={members ?? []}
        keyExtractor={(item) => item.member.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={() => (
          <View className="mb-4 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 p-6">
            <Text className="text-center text-xl font-bold text-white">
              🏆 Community Leaderboard
            </Text>
            <Text className="mt-1 text-center text-white/80">
              Top contributors this month
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-8">
            <Text className="text-zinc-500">No members yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-4 border-b border-zinc-100 py-4 dark:border-zinc-800">
            {/* Rank */}
            <View className="w-10 items-center">{getRankIcon(item.rank)}</View>

            {/* Avatar */}
            <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
              {item.user?.image ? (
                <Image
                  source={{ uri: item.user.image }}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <Text className="text-xl font-semibold text-zinc-600 dark:text-zinc-300">
                  {item.user?.name?.[0] ?? "?"}
                </Text>
              )}
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text className="font-semibold text-zinc-900 dark:text-white">
                {item.user?.name ?? "Anonymous"}
              </Text>
              <Text className="text-sm text-zinc-500">
                Level {item.member.level}
              </Text>
            </View>

            {/* Points */}
            <View className="items-end">
              <Text className="font-bold text-zinc-900 dark:text-white">
                {item.member.points?.toLocaleString()}
              </Text>
              <Text className="text-sm text-zinc-500">points</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
