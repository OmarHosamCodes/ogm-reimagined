import { Tabs } from "expo-router";
import { BookOpen, Home, Trophy, User } from "lucide-react-native";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#c03484",
        tabBarInactiveTintColor: isDark ? "#71717A" : "#A1A1AA",
        tabBarStyle: {
          backgroundColor: isDark ? "#18181B" : "#FFFFFF",
          borderTopColor: isDark ? "#27272A" : "#E4E4E7",
        },
        headerStyle: {
          backgroundColor: isDark ? "#18181B" : "#c03484",
        },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
