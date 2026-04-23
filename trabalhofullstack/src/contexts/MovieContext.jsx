import { createContext, useReducer } from "react";

export const MovieContext = createContext();

const initialState = {
  movies: [],
  loading: false,
  error: null,
};

function movieReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, movies: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export function MovieProvider({ children }) {
  const [state, dispatch] = useReducer(movieReducer, initialState);

  const searchMovies = async (query) => {
    if (!query) {
      dispatch({ type: "FETCH_ERROR", payload: "Digite um filme" });
      return;
    }

    dispatch({ type: "FETCH_START" });

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?s=${query}&apikey=${import.meta.env.VITE_API_KEY}`
      );
      const data = await res.json();

      if (data.Response === "False") {
        dispatch({ type: "FETCH_ERROR", payload: "Nenhum filme encontrado" });
      } else {
        dispatch({ type: "FETCH_SUCCESS", payload: data.Search });
      }
    } catch (error) {
      dispatch({ type: "FETCH_ERROR", payload: "Erro ao buscar dados" });
    }
  };

  return (
    <MovieContext.Provider value={{ ...state, searchMovies }}>
      {children}
    </MovieContext.Provider>
  );
}