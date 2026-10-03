import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#11131A" },
        headerTintColor: "#F5F6FA",
        contentStyle: { backgroundColor: "#11131A" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="movie/[id]" options={{ title: "" }} />
    </Stack>
  );
}
