import { useContext } from "react";
import { MovieContext } from "../contexts/MovieContext";
import MovieCard from "./MovieCard";
import "./MovieList.css";

export default function MovieList() {
  const { movies, loading, error } = useContext(MovieContext);

  if (loading) return <div className="loading-message">Carregando filmes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  if (movies.length === 0) {
    return (
      <div className="no-results-message">
        Nenhum filme encontrado. Use a busca para encontrar filmes.
      </div>
    );
  }

  return (
    <div className="movie-list-container">
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard 
            key={movie.imdbID || movie.id || `${movie.title}-${movie.year}`} 
            movie={movie} 
          />
        ))}
      </div>
    </div>
  );
}