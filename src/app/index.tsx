import { useCallback, useEffect, useState } from "react";
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
import { router } from "expo-router";
import { MovieSummary, OmdbError, getMoviesByIds, searchMovies } from "../lib/omdb";
import { CURATED_MOVIE_IDS } from "../lib/curatedMovies";

const ACCENT_COLOR = "#208AEF";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Стрічка "Топ за рейтингом", яку бачить користувач, поки нічого не шукав
  const [featured, setFeatured] = useState<MovieSummary[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

  useEffect(() => {
    getMoviesByIds(CURATED_MOVIE_IDS)
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setIsFeaturedLoading(false));
  }, []);

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchMovies(trimmed, 1);
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
  }

  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || results.length >= totalResults) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const data = await searchMovies(query.trim(), nextPage);
      setResults((current) => [...current, ...data.results]);
      setPage(nextPage);
    } catch {
      // Тихо ігноруємо помилку довантаження — користувач бачить уже отримані результати
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isLoading, results.length, totalResults, page, query]);

  function openMovie(imdbID: string) {
    router.push({ pathname: "/movie/[id]", params: { id: imdbID } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Movie Browser</Text>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          placeholder="Назва фільму..."
          placeholderTextColor="#8A8F9C"
          returnKeyType="search"
          style={styles.input}
        />
        <Pressable style={styles.searchButton} onPress={runSearch}>
          <Text style={styles.searchButtonText}>Пошук</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.spinner} color={ACCENT_COLOR} size="large" />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : hasSearched && results.length === 0 ? (
        <Text style={styles.message}>Нічого не знайдено</Text>
      ) : !hasSearched ? (
        isFeaturedLoading ? (
          <ActivityIndicator style={styles.spinner} color={ACCENT_COLOR} size="large" />
        ) : (
          <FlatList
            data={featured}
            keyExtractor={(item) => item.imdbID}
            ListHeaderComponent={<Text style={styles.resultsCount}>🔥 Топ за рейтингом</Text>}
            renderItem={({ item }) => (
              <MovieRow item={item} onPress={() => openMovie(item.imdbID)} />
            )}
          />
        )
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.imdbID}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          ListHeaderComponent={
            totalResults > 0 ? (
              <Text style={styles.resultsCount}>
                Знайдено: {totalResults}
              </Text>
            ) : null
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
