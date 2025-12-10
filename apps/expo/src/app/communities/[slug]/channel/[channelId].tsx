import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Heart, MessageCircle } from "lucide-react-native";
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

export default function ChannelScreen() {
  const { slug, channelId } = useLocalSearchParams<{
    slug: string;
    channelId: string;
  }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: channel, isLoading } = useQuery(
    trpc.channel.getById.queryOptions({ id: channelId }),
  );

  const { data: posts, refetch } = useQuery(
    trpc.post.listByChannel.queryOptions({ channelId, limit: 20 }),
  );

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
      {/* Channel header */}
      <View className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
          # {channel?.name ?? "Channel"}
        </Text>
        {channel?.description && (
          <Text className="mt-1 text-sm text-zinc-500">
            {channel.description}
          </Text>
        )}
      </View>

      {/* Posts */}
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
            <Text className="text-zinc-500">No posts in this channel yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/communities/${slug}/post/${item.id}`)}
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
            <Text
              className="mt-3 text-zinc-700 dark:text-zinc-300"
              numberOfLines={4}
            >
              {item.content}
            </Text>

            {/* Image preview */}
            {item.imageUrls && item.imageUrls.length > 0 && (
              <Image
                source={{ uri: item.imageUrls[0] }}
                className="mt-3 h-40 w-full rounded-lg"
                resizeMode="cover"
              />
            )}

            {/* Actions */}
            <View className="mt-4 flex-row items-center gap-6">
              <View className="flex-row items-center gap-1">
                <Heart size={18} color="#71717A" />
                <Text className="text-sm text-zinc-500">
                  {item._count?.likes ?? 0}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MessageCircle size={18} color="#71717A" />
                <Text className="text-sm text-zinc-500">
                  {item._count?.comments ?? 0}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
