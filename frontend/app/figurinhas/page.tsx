"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Figurinha = {
  id: string;
  time: string;
  categoria: number;
  nome_jogador: string;
  quantidade_repetidas: number;
};

type FigurinhaForm = {
  time: string;
  categoria: number | "";
  nome_jogador: string;
  quantidade_repetidas: number;
};

type FigurinhaFilter = {
  time: string;
  categoria: string;
  nome_jogador: string;
};

const emptyForm: FigurinhaForm = {
  time: "",
  categoria: "",
  nome_jogador: "",
  quantidade_repetidas: 0,
};

const emptyFilter: FigurinhaFilter = {
  time: "",
  categoria: "",
  nome_jogador: "",
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:3001";

const timesDisponiveis = [
  "Alemanha",
  "Argentina",
  "Austrália",
  "Bélgica",
  "Catar",
  "E.U.A",
  "França",
  "Noruega",
  "Paraguai",
  "Suécia",
  "África do Sul",
  "Canadá",
  "Colômbia",
  "Croácia",
  "Escócia",
  "Espanha",
  "Holanda",
  "Inglaterra",
  "Japão",
  "Áustria",
  "Brasil",
  "México",
  "Portugal",
  "Uruguai",
];

export default function FigurinhasPage() {
  const router = useRouter();
  const [list, setList] = useState<Figurinha[]>([]);
  const [form, setForm] = useState<FigurinhaForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFigurinha, setSelectedFigurinha] = useState<Figurinha | null>(
    null,
  );
  const [filterForm, setFilterForm] = useState<FigurinhaFilter>(emptyFilter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "edit" | "delete";
    figurinha: Figurinha | null;
  } | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("troca-figurinhas-token");
    if (!token) {
      router.push("/");
      return;
    }

    fetchFigurinhas(token);
  }, [router]);

  const fetchFigurinhas = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/figurinhas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Sessão expirada.");
      }

      const data = await response.json();
      const storedUserId = Number(
        window.localStorage.getItem("troca-figurinhas-user-id"),
      );
      const currentUserId = Number.isFinite(storedUserId)
        ? storedUserId
        : (() => {
            const token = window.localStorage.getItem("troca-figurinhas-token");
            if (!token) return null;

            const payload = token.split(".")[1];
            if (!payload) return null;

            try {
              const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
              const decoded = window.atob(
                normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
              );
              const parsed = JSON.parse(decoded) as { sub?: number | string };
              return parsed.sub !== undefined ? Number(parsed.sub) : null;
            } catch {
              return null;
            }
          })();

      if (!Number.isFinite(Number(currentUserId))) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const filteredList = data.filter(
        (item: { usuario_id?: number | string }) =>
          Number(item.usuario_id) === Number(currentUserId),
      );

      const sortedList = [...filteredList].sort((a, b) => {
        const timeComparison = a.time.localeCompare(b.time, "pt-BR", {
          sensitivity: "base",
        });

        if (timeComparison !== 0) {
          return timeComparison;
        }

        return a.nome_jogador.localeCompare(b.nome_jogador, "pt-BR", {
          sensitivity: "base",
        });
      });

      setList(sortedList);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Erro ao carregar figurinhas.",
      );
      window.localStorage.removeItem("troca-figurinhas-token");
      window.localStorage.removeItem("troca-figurinhas-user-id");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleChange =
    (field: keyof FigurinhaForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        field === "categoria"
          ? Number(event.target.value)
          : field === "quantidade_repetidas"
            ? Number(event.target.value)
            : event.target.value;

      setForm((current) => ({ ...current, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = window.localStorage.getItem("troca-figurinhas-token");
    if (!token) {
      router.push("/");
      return;
    }

    setError("");

    if (
      !form.time.trim() ||
      form.categoria === "" ||
      !form.nome_jogador.trim() ||
      form.quantidade_repetidas < 0
    ) {
      setError(
        "Preencha todos os campos para cadastrar ou alterar a figurinha.",
      );
      return;
    }

    try {
      const url = `${apiBaseUrl}/figurinhas${editingId ? `/${editingId}` : ""}`;
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Não foi possível salvar a figurinha.");
      }

      setForm(emptyForm);
      setEditingId(null);
      await fetchFigurinhas(token);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao salvar figurinha.",
      );
    }
  };

  const handleEdit = (figurinha: Figurinha) => {
    setEditingId(figurinha.id);
    setSelectedFigurinha(null);
    setConfirmAction(null);
    setForm({
      time: figurinha.time,
      categoria: figurinha.categoria,
      nome_jogador: figurinha.nome_jogador,
      quantidade_repetidas: figurinha.quantidade_repetidas,
    });
  };

  const handleDelete = (figurinha: Figurinha) => {
    setConfirmAction({ type: "delete", figurinha });
  };

  const confirmDelete = async (id: string) => {
    const token = window.localStorage.getItem("troca-figurinhas-token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/figurinhas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || "Não foi possível excluir a figurinha.",
        );
      }

      setList((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      setConfirmAction(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Erro ao excluir figurinha.",
      );
    }
  };

  const logout = () => {
    window.localStorage.removeItem("troca-figurinhas-token");
    window.localStorage.removeItem("troca-figurinhas-user-id");
    router.push("/");
  };

  const filteredList = list.filter((figurinha) => {
    const matchesTime =
      !filterForm.time ||
      figurinha.time
        .toLowerCase()
        .includes(filterForm.time.trim().toLowerCase());

    const matchesCategoria =
      !filterForm.categoria ||
      String(figurinha.categoria) === String(filterForm.categoria);

    const matchesJogador =
      !filterForm.nome_jogador ||
      figurinha.nome_jogador
        .toLowerCase()
        .includes(filterForm.nome_jogador.trim().toLowerCase());

    return matchesTime && matchesCategoria && matchesJogador;
  });

  const handleFilterChange =
    (field: keyof FigurinhaFilter) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        field === "categoria" ? event.target.value : event.target.value;

      setFilterForm((current) => ({ ...current, [field]: value }));
    };

  const clearFilters = () => {
    setFilterForm(emptyFilter);
  };

  const applyFilterFromForm = () => {
    setFilterForm({
      time: form.time,
      categoria: form.categoria === "" ? "" : String(form.categoria),
      nome_jogador: form.nome_jogador,
    });
  };

  const confirmFigurinha = confirmAction?.figurinha;

  const exportFigurinhasTxt = () => {
    const linhas = filteredList.map(
      (figurinha) =>
        `Time: ${figurinha.time} | Jogador: ${figurinha.nome_jogador} | Categoria: ${figurinha.categoria} | Repetidas: ${figurinha.quantidade_repetidas}`,
    );

    const content = linhas.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "figurinhas.txt";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="figurinhas-shell">
      <div className="figurinhas-card">
        <div className="topbar">
          <div>
            <span className="badge">Dashboard</span>
            <h2>Figurinhas</h2>
          </div>
          <div className="topbar-actions">
            <button type="button" className="danger-button" onClick={logout}>
              Sair
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="form-card"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.4)), url('/images/capa_album.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="form-grid">
            <label>
              <span>Time</span>
              <input
                type="text"
                list="time-options"
                value={form.time}
                onChange={handleChange("time")}
                placeholder="Ex: Brasil ou Argentina"
              />
              <datalist id="time-options">
                {timesDisponiveis.map((time) => (
                  <option key={time} value={time} />
                ))}
              </datalist>
            </label>

            <label>
              <span>Categoria</span>
              <select
                value={form.categoria}
                onChange={handleChange("categoria")}
              >
                <option value="">Selecione</option>
                <option value={50}>50</option>
                <option value={60}>60</option>
                <option value={70}>70</option>
              </select>
            </label>

            <label>
              <span>Nome do jogador</span>
              <input
                type="text"
                value={form.nome_jogador}
                onChange={handleChange("nome_jogador")}
                placeholder="Ex: Vinícius Júnior ou Lionel Messi"
              />
            </label>

            <label>
              <span>Quantidade de repetidas</span>
              <input
                type="number"
                min={0}
                value={form.quantidade_repetidas}
                onChange={handleChange("quantidade_repetidas")}
              />
            </label>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="topbar-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading
                ? "Salvando..."
                : editingId
                  ? "Salvar alterações"
                  : "Cadastrar"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={applyFilterFromForm}
            >
              Filtrar
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setFilterForm(emptyFilter);
              }}
            >
              Limpar filtros
            </button>
            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="table-section">
          <div className="table-header-row">
            <h3>Minhas figurinhas</h3>
            <button
              type="button"
              className="secondary-button small-button"
              onClick={exportFigurinhasTxt}
            >
              Salvar em .txt
            </button>
          </div>

          {list.length === 0 ? (
            <div className="empty-state">
              Nenhuma figurinha cadastrada ainda.
            </div>
          ) : filteredList.length === 0 ? (
            <div className="empty-state">
              Nenhuma figurinha encontrada para o time informado.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="figurinha-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Jogador</th>
                    <th>Categoria</th>
                    <th>Repetidas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((figurinha) => (
                    <tr
                      key={figurinha.id}
                      className="table-row"
                      onClick={() => setSelectedFigurinha(figurinha)}
                    >
                      <td>{figurinha.time}</td>
                      <td>{figurinha.nome_jogador}</td>
                      <td>{figurinha.categoria}</td>
                      <td>{figurinha.quantidade_repetidas}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="secondary-button small-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(figurinha);
                            }}
                          >
                            Alterar
                          </button>
                          <button
                            type="button"
                            className="danger-button small-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(figurinha);
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedFigurinha && (
        <div
          className="detail-overlay"
          onClick={() => setSelectedFigurinha(null)}
        >
          <div
            className="detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="detail-header">
              <h3>Detalhes da figurinha</h3>
              <button
                type="button"
                className="secondary-button small-button"
                onClick={() => setSelectedFigurinha(null)}
              >
                Fechar
              </button>
            </div>

            <div className="detail-grid">
              <div>
                <span>Time</span>
                <strong>{selectedFigurinha.time}</strong>
              </div>
              <div>
                <span>Jogador</span>
                <strong>{selectedFigurinha.nome_jogador}</strong>
              </div>
              <div>
                <span>Categoria</span>
                <strong>{selectedFigurinha.categoria}</strong>
              </div>
              <div>
                <span>Quantidade</span>
                <strong>{selectedFigurinha.quantidade_repetidas}</strong>
              </div>
            </div>

            <div className="detail-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSelectedFigurinha(null);
                  handleEdit(selectedFigurinha);
                }}
              >
                Alterar
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  setSelectedFigurinha(null);
                  handleDelete(selectedFigurinha);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && confirmFigurinha && (
        <div className="detail-overlay" onClick={() => setConfirmAction(null)}>
          <div
            className="detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="detail-header">
              <h3>
                {confirmAction.type === "edit"
                  ? "Confirmar alteração"
                  : "Confirmar exclusão"}
              </h3>
            </div>

            <p>
              {confirmAction.type === "edit"
                ? `Deseja alterar a figurinha de ${confirmFigurinha.time} - ${confirmFigurinha.nome_jogador}?`
                : `Deseja excluir a figurinha de ${confirmFigurinha.time} - ${confirmFigurinha.nome_jogador}?`}
            </p>

            <div className="detail-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmAction(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  confirmDelete(confirmFigurinha.id);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
