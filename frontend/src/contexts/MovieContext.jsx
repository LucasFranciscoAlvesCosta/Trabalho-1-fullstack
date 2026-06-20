import { createContext, useEffect, useReducer } from "react";

export const MovieContext = createContext();

const API_URL = "http://localhost:5000/api";

const initialState = {
  movies: [],
  loading: false,
  error: null,
  user: null,
  token: localStorage.getItem("authToken"),
  isAuthenticated: !!localStorage.getItem("authToken"),
};

function movieReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, movies: action.payload, error: null };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        error: null,
      };
    case "LOGOUT":
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        movies: [],
        error: null,
      };
    case "SET_USER":
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

export function MovieProvider({ children }) {
  const [state, dispatch] = useReducer(movieReducer, initialState);

  const fetchMoviesWithToken = async (token) => {
    const response = await fetch(`${API_URL}/movies`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar filmes");
    }

    dispatch({ type: "FETCH_SUCCESS", payload: data });
    return data;
  };

  useEffect(() => {
    if (state.token) {
      verifyToken(state.token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyToken = async (tokenValue) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${tokenValue}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token invalid");
      }

      const data = await response.json();
      dispatch({ type: "SET_USER", payload: data.user });

      try {
        await fetchMoviesWithToken(tokenValue);
      } catch (movieError) {
        console.error(movieError);
      }
    } catch (error) {
      localStorage.removeItem("authToken");
      dispatch({ type: "LOGOUT" });
    }
  };

  const register = async (username, password) => {
    dispatch({ type: "FETCH_START" });

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.errors
          ? data.errors.map((e) => e.msg).join(", ")
          : data.error;
        dispatch({ type: "FETCH_ERROR", payload: errorMessage });
        return false;
      }

      localStorage.setItem("authToken", data.token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { token: data.token, user: data.user },
      });

      try {
        await fetchMoviesWithToken(data.token);
      } catch (movieError) {
        console.error(movieError);
      }

      return true;
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Erro ao registrar",
      });
      return false;
    }
  };

  const login = async (username, password) => {
    dispatch({ type: "FETCH_START" });

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch({ type: "FETCH_ERROR", payload: data.error || "Login falhou" });
        return false;
      }

      localStorage.setItem("authToken", data.token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { token: data.token, user: data.user },
      });

      try {
        await fetchMoviesWithToken(data.token);
      } catch (movieError) {
        console.error(movieError);
      }

      return true;
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Erro ao fazer login",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      if (state.token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout sync error:", error);
    } finally {
      localStorage.removeItem("authToken");
      dispatch({ type: "LOGOUT" });
    }
  };

  const searchMovies = async (query, external = false) => {
    if (!query || !query.trim()) {
      dispatch({ type: "FETCH_ERROR", payload: "Digite um filme" });
      return;
    }

    dispatch({ type: "FETCH_START" });

    try {
      const externalParam = external ? "&external=true" : "";
      const response = await fetch(
        `${API_URL}/movies/search?query=${encodeURIComponent(query.trim())}${externalParam}`,
        {
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.errors
          ? data.errors.map((e) => e.msg).join(", ")
          : data.error;
        dispatch({ type: "FETCH_ERROR", payload: errorMessage });
        return;
      }

      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Erro ao buscar dados",
      });
    }
  };

  const addMovie = async (movieData) => {
    try {
      const response = await fetch(`${API_URL}/movies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify(movieData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.errors
          ? data.errors.map((e) => e.msg).join(", ")
          : data.error;
        throw new Error(errorMessage);
      }

      try {
        await fetchMoviesWithToken(state.token);
      } catch (movieError) {
        console.error(movieError);
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const getMovies = async () => {
    dispatch({ type: "FETCH_START" });

    try {
      await fetchMoviesWithToken(state.token);
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload: error.message || "Erro ao carregar filmes",
      });
    }
  };

  return (
    <MovieContext.Provider
      value={{
        ...state,
        searchMovies,
        addMovie,
        getMovies,
        login,
        register,
        logout,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
}