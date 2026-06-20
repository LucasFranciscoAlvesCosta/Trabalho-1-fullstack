import { useContext, useState } from "react";
import { MovieContext } from "./contexts/MovieContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Search from "./components/Search";
import MovieList from "./components/MovieList";
import AddMovie from "./components/AddMovie";
import "./App.css";

function App() {
  const { isAuthenticated, user, logout } = useContext(MovieContext);
  const [showLogin, setShowLogin] = useState(true);
  const [showAddMovie, setShowAddMovie] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        {showLogin ? (
          <Login onSwitchToRegister={() => setShowLogin(false)} />
        ) : (
          <Register onSwitchToLogin={() => setShowLogin(true)} />
        )}
      </>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🎬 Busca de Filmes</h1>
          <div className="user-info">
            <span>Bem-vindo, <strong>{user?.username}</strong>!</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="content-wrapper">
          <div className="search-section">
            <h2>Buscar Filmes</h2>
            <Search />
          </div>

          <div className="add-movie-section">
            <button 
              className="toggle-add-movie-btn"
              onClick={() => setShowAddMovie(!showAddMovie)}
            >
              {showAddMovie ? "✕ Fechar" : "➕ Adicionar Filme"}
            </button>
            {showAddMovie && <AddMovie />}
          </div>

          <div className="movies-section">
            <h2>Filmes</h2>
            <MovieList />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Aplicação de Busca de Filmes. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
