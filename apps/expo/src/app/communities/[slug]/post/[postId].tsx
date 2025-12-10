import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Heart, MessageCircle, Send } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { trpc } from "~/utils/api";

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: post, isLoading } = useQuery(
    trpc.post.getById.queryOptions({ id: postId }),
  );

  const { data: comments } = useQuery(
    trpc.comment.list.queryOptions({ postId }),
  );

  const createComment = useMutation(
    trpc.comment.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        setNewComment("");
      },
    }),
  );

  const toggleLike = useMutation(
    trpc.like.toggle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  if (isLoading || !post) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#c03484" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-zinc-900"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Post */}
        <View className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {/* Author */}
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
              {post.author?.user?.image ? (
                <Image
                  source={{ uri: post.author.user.image }}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <Text className="text-xl font-semibold text-zinc-600 dark:text-zinc-300">
                  {post.author?.user?.name?.[0] ?? "?"}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-zinc-900 dark:text-white">
                {post.author?.user?.name ?? "Anonymous"}
              </Text>
              <Text className="text-sm text-zinc-500">
                {new Date(post.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Content */}
          <Text className="mt-4 text-lg text-zinc-700 dark:text-zinc-300">
            {post.content}
          </Text>

          {/* Images */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <ScrollView
              horizontal
              className="mt-4"
              showsHorizontalScrollIndicator={false}
            >
              {post.imageUrls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  className="mr-2 h-48 w-72 rounded-lg"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          {/* Actions */}
          <View className="mt-4 flex-row items-center gap-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <TouchableOpacity
              onPress={() => toggleLike.mutate({ postId: post.id })}
              className="flex-row items-center gap-2"
            >
              <Heart
                size={24}
                color={post.isLiked ? "#c03484" : "#71717A"}
                fill={post.isLiked ? "#c03484" : "transparent"}
              />
              <Text className="text-zinc-600 dark:text-zinc-400">
                {post._count?.likes ?? 0}
              </Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-2">
              <MessageCircle size={24} color="#71717A" />
              <Text className="text-zinc-600 dark:text-zinc-400">
                {post._count?.comments ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Comments */}
        <Text className="mb-4 mt-6 text-lg font-semibold text-zinc-900 dark:text-white">
          Comments
        </Text>

        {comments?.map((comment) => (
          <View
            key={comment.id}
            className="mb-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
          >
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                <Text className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  {comment.author?.user?.name?.[0] ?? "?"}
                </Text>
              </View>
              <Text className="font-medium text-zinc-900 dark:text-white">
                {comment.author?.user?.name ?? "Anonymous"}
              </Text>
              <Text className="text-sm text-zinc-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text className="mt-2 text-zinc-700 dark:text-zinc-300">
              {comment.content}
            </Text>
          </View>
        ))}

        {(!comments || comments.length === 0) && (
          <View className="items-center py-4">
            <Text className="text-zinc-500">No comments yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Comment input */}
      <View className="flex-row items-center gap-2 border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
          placeholderTextColor="#71717A"
          className="flex-1 rounded-full bg-zinc-100 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-white"
          multiline
        />
        <TouchableOpacity
          onPress={() => {
            if (newComment.trim()) {
              createComment.mutate({
                postId: post.id,
                content: newComment.trim(),
              });
            }
          }}
          disabled={createComment.isPending || !newComment.trim()}
          className="rounded-full bg-pink-500 p-2"
        >
          <Send size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
