import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "~/utils/api";

import "../styles.css";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === "dark" ? "#18181B" : "#c03484",
            },
            headerTintColor: "#FFFFFF",
            contentStyle: {
              backgroundColor: colorScheme === "dark" ? "#09090B" : "#FFFFFF",
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Communities" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="communities/[slug]/post/[postId]"
            options={{ title: "Post" }}
          />
          <Stack.Screen
            name="courses/[courseId]/lesson/[lessonId]"
            options={{ title: "Lesson" }}
          />
        </Stack>
        <StatusBar />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
