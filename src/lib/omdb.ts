const BASE_URL = "https://www.omdbapi.com/";
const API_KEY = process.env.EXPO_PUBLIC_OMDB_API_KEY;

export type MovieSummary = {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
};

export type MovieDetails = MovieSummary & {
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Ratings: { Source: string; Value: string }[];
  imdbRating: string;
  imdbVotes: string;
  BoxOffice?: string;
};

export class OmdbError extends Error {}

async function omdbGet(params: Record<string, string>) {
  if (!API_KEY) {
    throw new OmdbError(
      "Відсутній ключ OMDb API. Додайте EXPO_PUBLIC_OMDB_API_KEY у файл .env"
    );
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("apikey", API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.Response === "False") {
    throw new OmdbError(data.Error ?? "Невідома помилка OMDb API");
  }

  return data;
}

export async function searchMovies(
  query: string,
  page: number
): Promise<{ results: MovieSummary[]; totalResults: number }> {
  const data = await omdbGet({ s: query, page: String(page) });

  return {
    results: data.Search as MovieSummary[],
    totalResults: Number(data.totalResults ?? 0),
  };
}

export async function getMovieDetails(imdbID: string): Promise<MovieDetails> {
  const data = await omdbGet({ i: imdbID, plot: "full" });
  return data as MovieDetails;
}

// Підтягує декілька фільмів за imdbID паралельно (ігноруючи окремі помилки)
// і сортує за рейтингом IMDb — використовується для стрічки "Топ за рейтингом".
export async function getMoviesByIds(imdbIDs: string[]): Promise<MovieDetails[]> {
  const results = await Promise.allSettled(imdbIDs.map((id) => getMovieDetails(id)));

  const movies = results
    .filter(
      (result): result is PromiseFulfilledResult<MovieDetails> => result.status === "fulfilled"
    )
    .map((result) => result.value);

  return movies.sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating));
}
