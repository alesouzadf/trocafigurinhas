"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

type UserForm = {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
};

const initialForm: UserForm = {
  nome: "",
  email: "",
  senha: "",
  telefone: "",
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";

const getUserIdFromToken = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
    );
    const parsed = JSON.parse(decoded) as { sub?: number | string };

    return parsed.sub !== undefined ? Number(parsed.sub) : null;
  } catch {
    return null;
  }
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const decodeTokenEmail = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
    );
    const parsed = JSON.parse(decoded) as { email?: string };

    return parsed.email || null;
  } catch {
    return null;
  }
};

const sanitizeUserFileName = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "usuario";

const getLoggedUserName = () => {
  const storedName = window.localStorage.getItem("troca-figurinhas-user-name");
  if (storedName) {
    return storedName;
  }

  const token = window.localStorage.getItem("troca-figurinhas-token");
  if (!token) {
    return "usuario";
  }

  const email = decodeTokenEmail(token);
  if (!email) {
    return "usuario";
  }

  return email.split("@")[0] || "usuario";
};

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<UserForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("troca-figurinhas-token");
    if (token) {
      router.push("/figurinhas");
    }
  }, [router]);

  const handleChange =
    (field: keyof UserForm) => (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "telefone"
          ? formatPhone(event.target.value)
          : event.target.value;

      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "login" : "register";
      const payload =
        mode === "login"
          ? {
              email: form.email,
              senha: form.senha,
            }
          : {
              nome: form.nome,
              email: form.email,
              senha: form.senha,
              telefone: form.telefone,
            };

      const response = await fetch(`${apiBaseUrl}/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Não foi possível concluir a operação.",
        );
      }

      window.localStorage.setItem("troca-figurinhas-token", data.token);
      const userName = data?.user?.nome || form.nome || "usuario";
      const normalizedUserName = sanitizeUserFileName(userName);
      window.localStorage.setItem(
        "troca-figurinhas-user-name",
        normalizedUserName,
      );

      const userIdFromToken = getUserIdFromToken(data.token);
      const userId = data?.user?.id ?? userIdFromToken;
      const numericUserId =
        userId !== undefined && userId !== null ? Number(userId) : null;

      if (numericUserId !== null && Number.isFinite(numericUserId)) {
        window.localStorage.setItem(
          "troca-figurinhas-user-id",
          String(numericUserId),
        );
      }

      router.push("/figurinhas");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Erro inesperado.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="badge">TrocaFigurinhas</span>
          <h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        </div>

        <div className="toggle-row">
          <button
            type="button"
            className={mode === "login" ? "toggle active" : "toggle"}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "toggle active" : "toggle"}
            onClick={() => setMode("register")}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <label>
              <span>Nome</span>
              <input
                type="text"
                value={form.nome}
                onChange={handleChange("nome")}
                placeholder="Seu nome"
                required
              />
            </label>
          )}

          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="seu@email.com"
              required
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              type="password"
              value={form.senha}
              onChange={handleChange("senha")}
              placeholder="Sua senha"
              required
            />
          </label>

          {mode === "register" && (
            <label>
              <span>Telefone</span>
              <input
                type="tel"
                value={form.telefone}
                onChange={handleChange("telefone")}
                placeholder="(00)00000-0000"
                inputMode="numeric"
                required
              />
            </label>
          )}

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading
              ? "Carregando..."
              : mode === "login"
                ? "Entrar"
                : "Cadastrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
