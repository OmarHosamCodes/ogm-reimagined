import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Users } from "lucide-react-native";
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

export default function CommunitiesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: communities,
    isLoading,
    refetch,
  } = useQuery(trpc.community.listMine.queryOptions());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <ActivityIndicator size="large" color="#c03484" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <FlatList
        data={communities ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListHeaderComponent={() => (
          <View className="mb-6">
            <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
              Your Communities
            </Text>
            <Text className="mt-1 text-zinc-500">
              Select a community to continue
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-12">
            <Users size={48} color="#71717A" />
            <Text className="mt-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">
              No communities yet
            </Text>
            <Text className="mt-2 text-center text-zinc-500">
              Join a community to see it here
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/communities/${item.slug}`)}
            className="flex-row items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Logo */}
            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-700">
              {item.logoUrl ? (
                <Image
                  source={{ uri: item.logoUrl }}
                  className="h-full w-full"
                />
              ) : (
                <Text className="text-2xl font-bold text-zinc-600 dark:text-zinc-300">
                  {item.name[0]}
                </Text>
              )}
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                {item.name}
              </Text>
              {item.description && (
                <Text className="mt-1 text-sm text-zinc-500" numberOfLines={2}>
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
