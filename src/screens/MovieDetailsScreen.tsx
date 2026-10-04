import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getMovieDetails, MovieDetails, OmdbError } from "../lib/omdb";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "MovieDetails">;

export default function MovieDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    getMovieDetails(id)
      .then((data) => {
        if (isActive) {
          setMovie(data);
        }
      })
      .catch((err) => {
        if (isActive) {
          setError(err instanceof OmdbError ? err.message : "Не вдалося завантажити фільм");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    if (movie) {
      navigation.setOptions({ title: movie.Title });
    }
  }, [movie, navigation]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#208AEF" size="large" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>{error ?? "Фільм не знайдено"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {movie.Poster && movie.Poster !== "N/A" ? (
          <Image source={{ uri: movie.Poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={styles.posterPlaceholderText}>Немає постера</Text>
          </View>
        )}

        <View style={styles.headerInfo}>
          <Text style={styles.title}>{movie.Title}</Text>
          <Text style={styles.subtitle}>
            {movie.Year} · {movie.Rated} · {movie.Runtime}
          </Text>
          <Text style={styles.subtitle}>{movie.Genre}</Text>

          {movie.imdbRating && movie.imdbRating !== "N/A" ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {movie.imdbRating} / 10</Text>
              <Text style={styles.ratingVotes}>{movie.imdbVotes} голосів</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Section title="Сюжет" text={movie.Plot} />
      <Section title="Режисер" text={movie.Director} />
      <Section title="Актори" text={movie.Actors} />
      <Section title="Мова" text={movie.Language} />
      <Section title="Країна" text={movie.Country} />
      <Section title="Нагороди" text={movie.Awards} />
      {movie.BoxOffice ? <Section title="Касові збори" text={movie.BoxOffice} /> : null}
    </ScrollView>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  if (!text || text === "N/A") {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#11131A",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#11131A",
  },
  message: {
    color: "#C7CAD4",
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#2A2E3C",
  },
  posterPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  posterPlaceholderText: {
    color: "#8A8F9C",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: "#F5F6FA",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: "#C7CAD4",
    fontSize: 13,
  },
  ratingBadge: {
    marginTop: 8,
    backgroundColor: "#1C1F2A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    gap: 2,
  },
  ratingText: {
    color: "#F5F6FA",
    fontWeight: "700",
    fontSize: 14,
  },
  ratingVotes: {
    color: "#8A8F9C",
    fontSize: 11,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#208AEF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  sectionText: {
    color: "#F5F6FA",
    fontSize: 15,
    lineHeight: 21,
  },
});
