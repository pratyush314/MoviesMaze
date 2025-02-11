import { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import NoMovies from "./components/NoDataMessage";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";
import NoDataMessage from "./components/NoDataMessage";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};
function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [movieErrorMessage, setMovieErrorMessage] = useState("");
  const [moviesList, setMoviesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendingErrorMessage, setTrendingErrorMessage] = useState(false);

  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm);
    },
    500,
    [searchTerm]
  );
  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setMovieErrorMessage("");
    try {
      const endPoint =
        API_BASE_URL +
        (query
          ? `/search/movie?query=${query}`
          : `/discover/movie?sort_by=popularity.desc`);
      const res = await fetch(endPoint, API_OPTIONS);
      if (!res.ok) throw new Error("Failed to fetch movies !");
      const data = await res.json();
      if (data.Response === "False") {
        setMovieErrorMessage(data.error || "Failed to fetch movies");
        setMoviesList([]);
        return;
      }
      setMoviesList(data.results || []);
      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      setMovieErrorMessage(
        "Error displaying moveis at the moment. Try again later!"
      );
      console.log("Error Fetching movies : " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    setLoadingTrends(true);
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error("Error fetching trending movies : ", error);
    } finally {
      setLoadingTrends(false);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You&apos;ll Enjoy
            Without The Hassel
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        <section className="trending">
          <h2>Trending Movies</h2>
          {loadingTrends ? (
            <div className="text-white flex justify-center">
              <Spinner />
            </div>
          ) : trendingErrorMessage ? (
            <p className="error-message text-red-500">{trendingErrorMessage}</p>
          ) : trendingMovies.length > 0 ? (
            <ul>
              {trendingMovies.map((movie, idx) => (
                <li key={movie.$id}>
                  <p>{idx + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          ) : (
            <NoDataMessage message="No Trending Movies Yet " />
          )}
        </section>

        <section className="all-movies">
          <h2 className="mt-[40px]">All Movies</h2>
          {isLoading ? (
            <div className="text-white">
              <Spinner />
            </div>
          ) : movieErrorMessage ? (
            <p className="error-message text-red-500">{movieErrorMessage}</p>
          ) : (
            <ul>
              {moviesList.length === 0 ? (
                <NoDataMessage message="No movies found. Try other title !" />
              ) : (
                moviesList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              )}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
