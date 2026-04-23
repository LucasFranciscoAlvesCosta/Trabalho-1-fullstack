import { useContext } from "react";
import { useForm } from "react-hook-form";
import { MovieContext } from "../contexts/MovieContext";

export default function Search() {
  const { searchMovies } = useContext(MovieContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    searchMovies(data.query);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="text"
        placeholder="Buscar filme..."
        {...register("query", {
          required: "Digite um filme",
        })}
      />

      <button type="submit">Buscar</button>

      {/* Erro de validação */}
      {errors.query && <p>{errors.query.message}</p>}
    </form>
  );
}