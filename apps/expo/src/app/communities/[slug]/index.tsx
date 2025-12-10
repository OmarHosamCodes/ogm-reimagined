import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Hash, Lock, Trophy } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trpc } from "~/utils/api";

export default function CommunityHomeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: community, isLoading } = useQuery(
    trpc.community.getBySlug.queryOptions({ slug }),
  );

  const { data: channels, refetch } = useQuery(
    trpc.channel.list.queryOptions({ communityId: community?.id ?? "" }),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !community) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <ActivityIndicator size="large" color="#c03484" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      {/* Header */}
      <View className="border-b border-zinc-200 bg-white px-4 pb-4 pt-6 dark:border-zinc-800 dark:bg-zinc-900">
        <View className="flex-row items-center gap-4">
          {community.logoUrl ? (
            <Image
              source={{ uri: community.logoUrl }}
              className="h-16 w-16 rounded-xl"
            />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900">
              <Text className="text-2xl font-bold text-pink-600 dark:text-pink-300">
                {community.name[0]}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xl font-bold text-zinc-900 dark:text-white">
              {community.name}
            </Text>
            {community.description && (
              <Text className="mt-1 text-sm text-zinc-500" numberOfLines={2}>
                {community.description}
              </Text>
            )}
          </View>
        </View>

        {/* Quick actions */}
        <View className="mt-4 flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push(`/communities/${slug}/courses`)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-zinc-100 py-3 dark:bg-zinc-800"
          >
            <BookOpen size={18} color="#c03484" />
            <Text className="font-medium text-zinc-900 dark:text-white">
              Courses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/communities/${slug}/leaderboard`)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-zinc-100 py-3 dark:bg-zinc-800"
          >
            <Trophy size={18} color="#c03484" />
            <Text className="font-medium text-zinc-900 dark:text-white">
              Leaderboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Channels */}
      <FlatList
        data={channels ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={() => (
          <Text className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Channels
          </Text>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-8">
            <Text className="text-zinc-500">No channels yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push(`/communities/${slug}/channel/${item.id}`)
            }
            className="flex-row items-center gap-3 rounded-lg py-3"
          >
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {item.isPrivate ? (
                <Lock size={16} color="#71717A" />
              ) : (
                <Hash size={16} color="#71717A" />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-medium text-zinc-900 dark:text-white">
                {item.name}
              </Text>
              {item.description && (
                <Text className="text-sm text-zinc-500" numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
