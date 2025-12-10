import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Play } from "lucide-react-native";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trpc } from "~/utils/api";

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const { data: course, isLoading } = useQuery(
    trpc.course.getById.queryOptions({ id: courseId }),
  );

  const { data: progress } = useQuery(
    trpc.progress.getCourseProgress.queryOptions({ courseId }),
  );

  if (isLoading || !course) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#c03484" />
      </View>
    );
  }

  const completedLessonIds = new Set(
    progress?.filter((p) => p.completedAt).map((p) => p.lessonId) ?? [],
  );

  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  const completedCount = completedLessonIds.size;
  const progressPercent =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-900">
      {/* Header */}
      {course.thumbnailUrl && (
        <Image
          source={{ uri: course.thumbnailUrl }}
          className="h-48 w-full"
          resizeMode="cover"
        />
      )}

      <View className="p-4">
        <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
          {course.title}
        </Text>

        {course.description && (
          <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
            {course.description}
          </Text>
        )}

        {/* Progress */}
        <View className="mt-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-zinc-700 dark:text-zinc-300">
              Your Progress
            </Text>
            <Text className="font-bold text-pink-500">
              {completedCount}/{totalLessons} lessons
            </Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <View
              className="h-full rounded-full bg-pink-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>

        {/* Modules */}
        <Text className="mb-4 mt-6 text-lg font-semibold text-zinc-900 dark:text-white">
          Course Content
        </Text>

        {course.modules.map((module, moduleIndex) => (
          <View key={module.id} className="mb-4">
            <Text className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">
              Module {moduleIndex + 1}: {module.title}
            </Text>

            {module.lessons.map((lesson, lessonIndex) => {
              const isCompleted = completedLessonIds.has(lesson.id);

              return (
                <TouchableOpacity
                  key={lesson.id}
                  onPress={() =>
                    router.push(`/courses/${courseId}/lesson/${lesson.id}`)
                  }
                  className="mb-2 flex-row items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      isCompleted
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-zinc-100 dark:bg-zinc-700"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={16} color="#22C55E" />
                    ) : (
                      <Play size={16} color="#71717A" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-zinc-900 dark:text-white">
                      {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                    </Text>
                    {lesson.isPreview && (
                      <Text className="text-sm text-pink-500">Preview</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
