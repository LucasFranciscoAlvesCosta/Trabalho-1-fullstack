import { useState, useContext } from "react";
import { MovieContext } from "../contexts/MovieContext";
import "./Auth.css";

export default function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, error } = useContext(MovieContext);

  const validatePassword = (pwd) => {
    const minLength = pwd.length >= 6;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);

    if (!minLength) return "Senha deve ter no mínimo 6 caracteres";
    if (!hasUpperCase) return "Senha deve conter pelo menos uma letra maiúscula";
    if (!hasLowerCase) return "Senha deve conter pelo menos uma letra minúscula";
    if (!hasNumber) return "Senha deve conter pelo menos um número";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    setIsLoading(true);
    const success = await register(username, password);
    setIsLoading(false);

    if (success) {
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Registrar</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuário:</label>
            <input
              id="username"
              type="text"
              placeholder="Nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha:</label>
            <input
              id="password"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <small>
              Mínimo 6 caracteres, com maiúscula, minúscula e número
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha:</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirme a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {passwordError && <div className="error-message">{passwordError}</div>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Carregando..." : "Registrar"}
          </button>
          <p className="auth-switch">
            Já tem conta?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="link-button"
            >
              Faça login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
