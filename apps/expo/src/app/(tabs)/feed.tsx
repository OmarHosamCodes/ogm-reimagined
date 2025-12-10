import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Heart, MessageCircle, Share2 } from "lucide-react-native";
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

export default function FeedScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // TODO: Get from community context
  const communityId = "default-community-id";

  const {
    data: posts,
    isLoading,
    refetch,
  } = useQuery(
    trpc.post.listByCommunity.queryOptions({ communityId, limit: 20 }),
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

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-8">
            <Text className="text-zinc-500">No posts yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push(`/communities/${communityId}/post/${item.id}`)
            }
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Author */}
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                {item.author?.user?.image ? (
                  <Image
                    source={{ uri: item.author.user.image }}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <Text className="text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                    {item.author?.user?.name?.[0] ?? "?"}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-zinc-900 dark:text-white">
                  {item.author?.user?.name ?? "Anonymous"}
                </Text>
                <Text className="text-sm text-zinc-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Content */}
            <Text className="mt-3 text-zinc-700 dark:text-zinc-300">
              {item.content}
            </Text>

            {/* Image */}
            {item.imageUrls && item.imageUrls.length > 0 && (
              <Image
                source={{ uri: item.imageUrls[0] }}
                className="mt-3 h-48 w-full rounded-lg"
                resizeMode="cover"
              />
            )}

            {/* Actions */}
            <View className="mt-4 flex-row items-center gap-6">
              <TouchableOpacity className="flex-row items-center gap-1">
                <Heart size={20} color="#71717A" />
                <Text className="text-sm text-zinc-500">
                  {item._count?.likes ?? 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center gap-1">
                <MessageCircle size={20} color="#71717A" />
                <Text className="text-sm text-zinc-500">
                  {item._count?.comments ?? 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Share2 size={20} color="#71717A" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
