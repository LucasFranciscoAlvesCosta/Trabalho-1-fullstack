import { useContext } from "react";
import { MovieContext } from "../contexts/MovieContext";
import MovieCard from "./MovieCard";

export default function MovieList() {
  const { movies, loading, error } = useContext(MovieContext);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      {movies.map((movie) => (
        <MovieCard key={movie.imdbID} movie={movie} />
      ))}
    </div>
  );
}