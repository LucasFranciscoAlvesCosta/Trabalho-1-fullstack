import { useContext, useState } from "react";
import { MovieContext } from "../contexts/MovieContext";
import "./Search.css";

export default function Search() {
  const [input, setInput] = useState("");
  const [external, setExternal] = useState(false);
  const { searchMovies, loading } = useContext(MovieContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    searchMovies(input, external);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Buscar filme..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="search-input"
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
        <div className="search-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={external}
              onChange={(e) => setExternal(e.target.checked)}
              disabled={loading}
            />
            Buscar também na base OMDB
          </label>
        </div>
      </form>
    </div>
  );
}