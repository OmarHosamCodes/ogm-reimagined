import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Lock, Play } from "lucide-react-native";
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

export default function CoursesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // TODO: Get from community context
  const communityId = "default-community-id";

  const {
    data: courses,
    isLoading,
    refetch,
  } = useQuery(trpc.course.list.queryOptions({ communityId }));

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

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <FlatList
        data={courses ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ gap: 16 }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-8">
            <Text className="text-zinc-500">No courses yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              if (item.isUnlocked) {
                router.push(`/courses/${item.id}`);
              }
            }}
            className="flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            disabled={!item.isUnlocked}
          >
            {/* Thumbnail */}
            <View className="aspect-video bg-zinc-200 dark:bg-zinc-700">
              {item.thumbnailUrl ? (
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Play size={32} color="#71717A" />
                </View>
              )}

              {/* Lock overlay */}
              {!item.isUnlocked && (
                <View className="absolute inset-0 items-center justify-center bg-black/60">
                  <Lock size={24} color="#FFFFFF" />
                  <Text className="mt-1 text-sm text-white">Locked</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View className="p-3">
              <Text
                className="font-semibold text-zinc-900 dark:text-white"
                numberOfLines={2}
              >
                {item.title}
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
