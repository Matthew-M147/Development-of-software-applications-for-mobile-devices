import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SearchScreen from "./src/screens/SearchScreen";
import MovieDetailsScreen from "./src/screens/MovieDetailsScreen";

export type RootStackParamList = {
  Search: undefined;
  MovieDetails: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#11131A" },
          headerTintColor: "#F5F6FA",
          contentStyle: { backgroundColor: "#11131A" },
        }}
      >
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MovieDetails"
          component={MovieDetailsScreen}
          options={{ title: "" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
