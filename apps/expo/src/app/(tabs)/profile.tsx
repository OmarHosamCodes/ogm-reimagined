import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Award,
  BookOpen,
  LogOut,
  MessageCircle,
  Settings,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // TODO: Get from community context
  const communityId = "default-community-id";

  const { data: session, isLoading } = useQuery(
    trpc.auth.getSession.queryOptions(),
  );

  const { data: memberProfile } = useQuery(
    trpc.member.getProfile.queryOptions({ communityId }),
  );

  const { data: progress } = useQuery(
    trpc.progress.getMemberProgress.queryOptions({}),
  );

  const handleLogout = async () => {
    await authClient.signOut();
    queryClient.clear();
    router.replace("/");
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#c03484" />
      </View>
    );
  }

  if (!session?.user) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-lg text-zinc-500">Not signed in</Text>
        <TouchableOpacity
          onPress={() => router.push("/")}
          className="mt-4 rounded-full bg-pink-500 px-6 py-3"
        >
          <Text className="font-semibold text-white">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedLessons = progress?.filter((p) => p.completedAt).length ?? 0;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-900">
      {/* Header */}
      <View className="items-center px-6 pb-6 pt-8">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
          {session.user.image ? (
            <Image
              source={{ uri: session.user.image }}
              className="h-24 w-24 rounded-full"
            />
          ) : (
            <Text className="text-3xl font-bold text-zinc-600 dark:text-zinc-300">
              {session.user.name?.[0] ?? "?"}
            </Text>
          )}
        </View>

        <Text className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">
          {session.user.name}
        </Text>

        <Text className="mt-1 text-zinc-500">{session.user.email}</Text>

        {memberProfile && (
          <View className="mt-2 flex-row items-center gap-2">
            <View className="rounded-full bg-pink-100 px-3 py-1 dark:bg-pink-900">
              <Text className="font-medium text-pink-700 dark:text-pink-300">
                Level {memberProfile.level}
              </Text>
            </View>
            <Text className="text-zinc-500">
              {memberProfile.points?.toLocaleString()} points
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View className="flex-row gap-4 px-6">
        <View className="flex-1 items-center rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800">
          <Award size={24} color="#c03484" />
          <Text className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {memberProfile?.level ?? 1}
          </Text>
          <Text className="text-sm text-zinc-500">Level</Text>
        </View>
        <View className="flex-1 items-center rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800">
          <BookOpen size={24} color="#c03484" />
          <Text className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {completedLessons}
          </Text>
          <Text className="text-sm text-zinc-500">Lessons</Text>
        </View>
        <View className="flex-1 items-center rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800">
          <MessageCircle size={24} color="#c03484" />
          <Text className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {memberProfile?.points ?? 0}
          </Text>
          <Text className="text-sm text-zinc-500">Points</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="mt-6 px-6">
        <TouchableOpacity className="flex-row items-center gap-4 border-b border-zinc-100 py-4 dark:border-zinc-800">
          <Settings size={20} color="#71717A" />
          <Text className="flex-1 text-zinc-900 dark:text-white">Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center gap-4 py-4"
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="flex-1 text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
