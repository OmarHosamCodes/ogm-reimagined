import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, ChevronRight } from "lucide-react-native";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { trpc } from "~/utils/api";

const { width } = Dimensions.get("window");

export default function LessonScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{
    courseId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery(
    trpc.lesson.getById.queryOptions({ id: lessonId }),
  );

  const { data: course } = useQuery(
    trpc.course.getById.queryOptions({ id: courseId }),
  );

  const markComplete = useMutation(
    trpc.progress.markComplete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  if (isLoading || !lesson) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#c03484" />
      </View>
    );
  }

  // Find prev/next lessons
  let prevLesson: { id: string; title: string } | null = null;
  let nextLesson: { id: string; title: string } | null = null;

  if (course) {
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);

    if (currentIndex > 0) {
      const prev = allLessons[currentIndex - 1];
      if (prev) {
        prevLesson = { id: prev.id, title: prev.title };
      }
    }
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      if (next) {
        nextLesson = { id: next.id, title: next.title };
      }
    }
  }

  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    );
    if (youtubeMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch?.[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      {/* Video player */}
      {lesson.videoUrl && (
        <View style={{ width, height: (width * 9) / 16 }}>
          <WebView
            source={{ uri: getVideoEmbedUrl(lesson.videoUrl) }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            style={{ flex: 1, backgroundColor: "#000" }}
          />
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Title */}
        <Text className="text-xl font-bold text-zinc-900 dark:text-white">
          {lesson.title}
        </Text>

        {/* Content */}
        {lesson.content && (
          <Text className="mt-4 text-zinc-600 dark:text-zinc-400">
            {lesson.content}
          </Text>
        )}

        {/* Mark complete */}
        <TouchableOpacity
          onPress={() => markComplete.mutate({ lessonId: lesson.id })}
          disabled={markComplete.isPending}
          className="mt-6 flex-row items-center justify-center gap-2 rounded-lg bg-green-500 py-3"
        >
          <Check size={20} color="#FFFFFF" />
          <Text className="font-semibold text-white">
            {markComplete.isPending ? "Marking..." : "Mark as Complete"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Navigation */}
      <View className="flex-row items-center justify-between border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {prevLesson ? (
          <TouchableOpacity
            onPress={() =>
              router.replace(`/courses/${courseId}/lesson/${prevLesson.id}`)
            }
            className="flex-row items-center gap-1"
          >
            <ChevronLeft size={20} color="#c03484" />
            <Text className="text-pink-500" numberOfLines={1}>
              Previous
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {nextLesson && (
          <TouchableOpacity
            onPress={() =>
              router.replace(`/courses/${courseId}/lesson/${nextLesson.id}`)
            }
            className="flex-row items-center gap-1"
          >
            <Text className="text-pink-500" numberOfLines={1}>
              Next
            </Text>
            <ChevronRight size={20} color="#c03484" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
