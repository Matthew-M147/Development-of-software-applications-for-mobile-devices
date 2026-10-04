import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MovieSummary, OmdbError, searchMovies } from "../lib/omdb";
import type { RootStackParamList } from "../../App";

const ACCENT_COLOR = "#208AEF";

// Поки користувач нічого не шукав, одразу показуємо результати цього
// простого запиту — без жодного захардкодженого списку фільмів.
const DEFAULT_QUERY = "movie";

type Props = NativeStackScreenProps<RootStackParamList, "Search">;

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(true);

  // Запит, за яким реально отримані поточні результати (потрібен для довантаження сторінок)
  const activeQueryRef = useRef(DEFAULT_QUERY);

  // Виконує запит і оновлює результати. Не чіпає isLoading/error/isDefault
  // синхронно, щоб виклик зі useEffect не тригерив react-hooks/set-state-in-effect —
  // ці прапорці або вже мають потрібне значення (стан за замовчуванням),
  // або їх виставляє викликач (handleSearchPress) перед викликом.
  const performSearch = useCallback(async (searchTerm: string) => {
    activeQueryRef.current = searchTerm;

    try {
      const data = await searchMovies(searchTerm, 1);
      setResults(data.results);
      setTotalResults(data.totalResults);
      setPage(1);
    } catch (err) {
      setResults([]);
      setTotalResults(0);
      setError(err instanceof OmdbError ? err.message : "Не вдалося виконати пошук");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Пряма комбінація виклик+.then/.catch/.finally (а не виклик локальної
  // useCallback-функції) — так лінтер коректно бачить, що setState
  // відбувається лише в асинхронних колбеках, а не синхронно в тілі ефекту.
  useEffect(() => {
    activeQueryRef.current = DEFAULT_QUERY;

    searchMovies(DEFAULT_QUERY, 1)
      .then((data) => {
        setResults(data.results);
        setTotalResults(data.totalResults);
        setPage(1);
      })
      .catch((err) => {
        setResults([]);
        setTotalResults(0);
        setError(err instanceof OmdbError ? err.message : "Не вдалося виконати пошук");
      })
      .finally(() => setIsLoading(false));
  }, []);

  function handleSearchPress() {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsDefault(false);
    performSearch(trimmed);
  }

  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || results.length >= totalResults) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const data = await searchMovies(activeQueryRef.current, nextPage);
      setResults((current) => [...current, ...data.results]);
      setPage(nextPage);
    } catch {
      // Тихо ігноруємо помилку довантаження — користувач бачить уже отримані результати
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isLoading, results.length, totalResults, page]);

  function openMovie(imdbID: string) {
    navigation.navigate("MovieDetails", { id: imdbID });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Movie Browser</Text>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearchPress}
          placeholder="Назва фільму..."
          placeholderTextColor="#8A8F9C"
          returnKeyType="search"
          style={styles.input}
        />
        <Pressable style={styles.searchButton} onPress={handleSearchPress}>
          <Text style={styles.searchButtonText}>Пошук</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.spinner} color={ACCENT_COLOR} size="large" />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : results.length === 0 ? (
        <Text style={styles.message}>Нічого не знайдено</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.imdbID}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {isDefault ? "Пропонуємо почати з:" : `Знайдено: ${totalResults}`}
            </Text>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator style={styles.spinner} color={ACCENT_COLOR} />
            ) : null
          }
          renderItem={({ item }) => (
            <MovieRow item={item} onPress={() => openMovie(item.imdbID)} />
          )}
        />
      )}
    </View>
  );
}

function MovieRow({ item, onPress }: { item: MovieSummary; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {item.Poster && item.Poster !== "N/A" ? (
        <Image source={{ uri: item.Poster }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={styles.posterPlaceholderText}>Немає{"\n"}постера</Text>
        </View>
      )}

      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{item.Title}</Text>
        <Text style={styles.rowSubtitle}>
          {item.Year} · {item.Type}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#11131A",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F5F6FA",
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#1C1F2A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F5F6FA",
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#11131A",
    fontWeight: "700",
    fontSize: 15,
  },
  spinner: {
    marginTop: 24,
  },
  message: {
    marginTop: 24,
    textAlign: "center",
    color: "#C7CAD4",
    fontSize: 15,
  },
  resultsCount: {
    color: "#8A8F9C",
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#1C1F2A",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  poster: {
    width: 56,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#2A2E3C",
  },
  posterPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  posterPlaceholderText: {
    color: "#8A8F9C",
    fontSize: 10,
    textAlign: "center",
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: "#F5F6FA",
    fontSize: 16,
    fontWeight: "600",
  },
  rowSubtitle: {
    color: "#8A8F9C",
    fontSize: 13,
  },
});
