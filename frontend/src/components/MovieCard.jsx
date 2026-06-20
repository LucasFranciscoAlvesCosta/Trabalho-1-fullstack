import "./MovieCard.css";

export default function MovieCard({ movie }) {
  const isExternal = movie.external || false;
  
  return (
    <div className={`movie-card ${isExternal ? "external" : ""}`}>
      {isExternal && <span className="external-badge">OMDB</span>}
      <div className="movie-poster">
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} />
        ) : (
          <div className="no-poster">Sem Poster</div>
        )}
      </div>
      <div className="movie-content">
        <h3>{movie.title}</h3>
        {movie.year && <p className="movie-year">{movie.year}</p>}
        {movie.genre && <p className="movie-genre">{movie.genre}</p>}
        {movie.director && (
          <p className="movie-director">
            <strong>Diretor:</strong> {movie.director}
          </p>
        )}
        {movie.actors && (
          <p className="movie-actors">
            <strong>Atores:</strong> {movie.actors}
          </p>
        )}
        {movie.plot && (
          <p className="movie-plot">{movie.plot}</p>
        )}
      </div>
    </div>
  );
}