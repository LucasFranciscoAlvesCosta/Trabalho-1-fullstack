import { useState, useContext } from "react";
import { MovieContext } from "../contexts/MovieContext";
import "./AddMovie.css";

export default function AddMovie({ onMovieAdded }) {
  const [formData, setFormData] = useState({
    imdbID: "",
    title: "",
    year: "",
    poster: "",
    plot: "",
    genre: "",
    director: "",
    actors: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addMovie } = useContext(MovieContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await addMovie(formData);
      setSuccess("Filme adicionado com sucesso!");
      setFormData({
        imdbID: "",
        title: "",
        year: "",
        poster: "",
        plot: "",
        genre: "",
        director: "",
        actors: "",
      });

      if (onMovieAdded) {
        onMovieAdded(result);
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Erro ao adicionar filme");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-movie-container">
      <div className="add-movie-card">
        <h3>Adicionar Novo Filme</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="imdbID">IMDb ID *</label>
            <input
              id="imdbID"
              type="text"
              name="imdbID"
              value={formData.imdbID}
              onChange={handleChange}
              placeholder="Ex: tt0111161"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">Título *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Título do filme"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Ano</label>
              <input
                id="year"
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="Ex: 1994"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="genre">Gênero</label>
              <input
                id="genre"
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Ex: Drama, Crime"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="director">Diretor</label>
            <input
              id="director"
              type="text"
              name="director"
              value={formData.director}
              onChange={handleChange}
              placeholder="Nome do diretor"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="actors">Atores</label>
            <input
              id="actors"
              type="text"
              name="actors"
              value={formData.actors}
              onChange={handleChange}
              placeholder="Ex: Ator1, Ator2, Ator3"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="plot">Sinopse</label>
            <textarea
              id="plot"
              name="plot"
              value={formData.plot}
              onChange={handleChange}
              placeholder="Descrição do filme"
              rows="3"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="poster">URL do Poster</label>
            <input
              id="poster"
              type="url"
              name="poster"
              value={formData.poster}
              onChange={handleChange}
              placeholder="https://exemplo.com/poster.jpg"
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Adicionando..." : "Adicionar Filme"}
          </button>
        </form>
      </div>
    </div>
  );
}
