"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Figurinha = {
  id: string;
  figurinha_id: number;
  quantidade: number;
  equipe: string;
  foto: string;
  nome_jogador: string;
  categoria: string;
};

type FigurinhaForm = {
  figurinha_id: number | "";
  quantidade: number;
};

type FigurinhaFilter = {
  figurinha_id: string;
  equipe: string;
  nome_jogador: string;
  categoria: string;
};

type CatalogFigurinha = {
  id: number;
  figurinha_id: number;
  nome_jogador: string;
  foto: string;
  equipe: string;
  categoria: string;
};

const emptyForm: FigurinhaForm = {
  figurinha_id: "",
  quantidade: 0,
};

const emptyFilter: FigurinhaFilter = {
  figurinha_id: "",
  equipe: "",
  nome_jogador: "",
  categoria: "",
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:3001";

export default function FigurinhasPage() {
  const router = useRouter();
  const [list, setList] = useState<Figurinha[]>([]);
  const [form, setForm] = useState<FigurinhaForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFigurinha, setSelectedFigurinha] = useState<Figurinha | null>(
    null,
  );
  const [selectedCatalogFigurinha, setSelectedCatalogFigurinha] =
    useState<CatalogFigurinha | null>(null);
  const [filterForm, setFilterForm] = useState<FigurinhaFilter>(emptyFilter);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
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

  const fetchCatalogFigurinha = async (figurinhaId: number) => {
    if (!figurinhaId || Number(figurinhaId) <= 0) {
      setSelectedCatalogFigurinha(null);
      return;
    }

    const token = window.localStorage.getItem("troca-figurinhas-token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      setCatalogLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/figurinhas/catalog/${figurinhaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        setSelectedCatalogFigurinha(null);
        return;
      }

      const data = (await response.json()) as CatalogFigurinha;
      setSelectedCatalogFigurinha(data);
    } catch {
      setSelectedCatalogFigurinha(null);
    } finally {
      setCatalogLoading(false);
    }
  };

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

      const data = (await response.json()) as Figurinha[];
      const sortedList = [...data].sort(
        (a, b) => Number(a.figurinha_id) - Number(b.figurinha_id),
      );

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
        field === "figurinha_id"
          ? Number(event.target.value) || ""
          : Number(event.target.value);

      setForm((current) => ({ ...current, [field]: value }));

      if (field === "figurinha_id" && typeof value === "number" && value > 0) {
        void fetchCatalogFigurinha(value);
      }

      if (field === "figurinha_id" && (value === "" || Number(value) <= 0)) {
        setSelectedCatalogFigurinha(null);
      }
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
      !form.figurinha_id ||
      Number(form.figurinha_id) <= 0 ||
      form.quantidade < 0
    ) {
      setError("Informe o número da figurinha e a quantidade para continuar.");
      return;
    }

    try {
      const url = `${apiBaseUrl}/figurinhas${editingId ? `/${editingId}` : ""}`;
      const method = editingId ? "PATCH" : "POST";
      const body = editingId
        ? { quantidade: Number(form.quantidade) }
        : {
            figurinha_id: Number(form.figurinha_id),
            quantidade: Number(form.quantidade),
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Não foi possível salvar a figurinha.");
      }

      setForm(emptyForm);
      setEditingId(null);
      setSelectedCatalogFigurinha(null);
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
      figurinha_id: figurinha.figurinha_id,
      quantidade: figurinha.quantidade,
    });
    void fetchCatalogFigurinha(figurinha.figurinha_id);
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
      setSelectedCatalogFigurinha(null);
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
    const matchesNumero =
      !filterForm.figurinha_id ||
      String(figurinha.figurinha_id) === filterForm.figurinha_id.trim();

    const matchesEquipe =
      !filterForm.equipe ||
      figurinha.equipe
        .toLowerCase()
        .includes(filterForm.equipe.trim().toLowerCase());

    const matchesJogador =
      !filterForm.nome_jogador ||
      figurinha.nome_jogador
        .toLowerCase()
        .includes(filterForm.nome_jogador.trim().toLowerCase());

    const matchesCategoria =
      !filterForm.categoria ||
      String(figurinha.categoria)
        .toLowerCase()
        .includes(filterForm.categoria.trim().toLowerCase());

    return matchesNumero && matchesEquipe && matchesJogador && matchesCategoria;
  });

  const handleFilterChange =
    (field: keyof FigurinhaFilter) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFilterForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const clearFilters = () => {
    setFilterForm(emptyFilter);
  };

  const applyFilterFromForm = () => {
    setFilterForm({
      figurinha_id: form.figurinha_id === "" ? "" : String(form.figurinha_id),
      equipe: selectedCatalogFigurinha?.equipe ?? "",
      nome_jogador: selectedCatalogFigurinha?.nome_jogador ?? "",
      categoria: selectedCatalogFigurinha?.categoria ?? "",
    });
  };

  const confirmFigurinha = confirmAction?.figurinha;
  const displayedFigurinhaNumber =
    form.figurinha_id !== "" && form.figurinha_id !== null
      ? Number(form.figurinha_id)
      : (selectedCatalogFigurinha?.figurinha_id ??
        selectedCatalogFigurinha?.id);

  const exportFigurinhasTxt = () => {
    const storedUserName =
      window.localStorage.getItem("troca-figurinhas-user-name") ||
      (() => {
        const token = window.localStorage.getItem("troca-figurinhas-token");
        if (!token) return "usuario";

        try {
          const payload = token.split(".")[1];
          if (!payload) return "usuario";

          const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
          const decoded = window.atob(
            normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
          );
          const parsed = JSON.parse(decoded) as { email?: string };
          return parsed.email?.split("@")[0] || "usuario";
        } catch {
          return "usuario";
        }
      })();

    const sanitizedUserName = storedUserName
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();

    const figurinhasComQuantidadeMaiorQueUm = filteredList.filter(
      (figurinha) => Number(figurinha.quantidade) > 1,
    );

    const linhas = figurinhasComQuantidadeMaiorQueUm.length
      ? figurinhasComQuantidadeMaiorQueUm.map(
          (figurinha) =>
            `Número: ${figurinha.figurinha_id} | Time: ${figurinha.equipe} | Jogador: ${figurinha.nome_jogador} | Categoria: ${figurinha.categoria} | Quantidade: ${figurinha.quantidade}`,
        )
      : ["Nenhuma figurinha com quantidade maior que 1."];

    const content = linhas.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizedUserName || "usuario"}_figurinhas.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const renderPrintRow = (figurinha: Figurinha) => {
    const equipe = figurinha.equipe || "-";
    const jogador = figurinha.nome_jogador || "-";
    const categoria = figurinha.categoria || "-";
    const fotoHtml = figurinha.foto
      ? `<img src="${figurinha.foto}" alt="${jogador}" style="width: 54px; height: 54px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px; background: #f8fafc; border: 1px solid #dfe7f5;" />`
      : "-";

    return `
      <tr>
        <td>${figurinha.figurinha_id}</td>
        <td>${equipe}</td>
        <td>${fotoHtml}</td>
        <td>${jogador}</td>
        <td>${categoria}</td>
        <td>${figurinha.quantidade}</td>
      </tr>
    `;
  };

  const printFigurinhas = (
    items: Figurinha[] = filteredList,
    title = "Lista de figurinhas",
  ) => {
    const rows = items.map(renderPrintRow).join("");
    const printWindow = window.open("", "_blank", "width=980,height=700");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Figurinhas - Impressão</title>
          <style>
            :root {
              --bg: #f8fafc;
              --text: #0f172a;
              --muted: #475569;
              --border: #dfe7f5;
              --thead: #f1f5f9;
            }

            * { box-sizing: border-box; }

            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, Helvetica, sans-serif;
              background: var(--bg);
              color: var(--text);
            }

            h1 {
              margin: 0 0 8px;
              font-size: 24px;
              color: var(--text);
            }

            .meta {
              margin: 0 0 18px;
              color: var(--muted);
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border: 1px solid var(--border);
              box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
            }

            thead th {
              background: var(--thead);
              color: var(--text);
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              padding: 12px 10px;
              border: 1px solid var(--border);
              text-align: left;
            }

            tbody td {
              padding: 10px 10px;
              border: 1px solid var(--border);
              font-size: 12px;
              color: var(--text);
              vertical-align: middle;
            }

            tbody tr:nth-child(even) {
              background: #f8fbff;
            }

            .empty {
              padding: 18px;
              text-align: center;
              color: var(--muted);
              background: white;
              border: 1px solid var(--border);
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }

              table {
                box-shadow: none;
              }

              thead {
                display: table-header-group;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="meta">Total: ${items.length}</p>
          ${
            rows
              ? `
                <table>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Equipe</th>
                      <th>Foto</th>
                      <th>Jogador</th>
                      <th>Categoria</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              `
              : '<div class="empty">Nenhuma figurinha encontrada.</div>'
          }
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const printFigurinhasSemQuantidade = () => {
    const faltantes = filteredList.filter(
      (figurinha) => Number(figurinha.quantidade) === 0,
    );

    printFigurinhas(faltantes, "Figurinhas com quantidade 0");
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
              <span>Número da figurinha</span>
              <input
                type="number"
                min={1}
                value={form.figurinha_id}
                onChange={handleChange("figurinha_id")}
                placeholder="Ex: 42"
                disabled={Boolean(editingId)}
                readOnly={Boolean(editingId)}
              />
            </label>

            <label>
              <span>Quantidade</span>
              <input
                type="number"
                min={0}
                value={form.quantidade}
                onChange={handleChange("quantidade")}
              />
            </label>
          </div>

          {catalogLoading && (
            <p className="success-message">Buscando dados da figurinha...</p>
          )}

          {selectedCatalogFigurinha && (
            <div className="detail-grid" style={{ marginTop: 16 }}>
              {selectedCatalogFigurinha.foto && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <img
                    src={selectedCatalogFigurinha.foto}
                    alt={selectedCatalogFigurinha.nome_jogador}
                    style={{
                      maxWidth: 180,
                      maxHeight: 180,
                      objectFit: "contain",
                      borderRadius: 12,
                      background: "#fff",
                      padding: 8,
                    }}
                  />
                </div>
              )}
              <div>
                <span>Equipe</span>
                <strong>{selectedCatalogFigurinha.equipe}</strong>
              </div>
              <div>
                <span>Jogador</span>
                <strong>{selectedCatalogFigurinha.nome_jogador}</strong>
              </div>
              <div>
                <span>Categoria</span>
                <strong>{selectedCatalogFigurinha.categoria}</strong>
              </div>
              <div>
                <span>Número</span>
                <strong>{displayedFigurinhaNumber ?? "-"}</strong>
              </div>
            </div>
          )}

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
              onClick={clearFilters}
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
                  setSelectedCatalogFigurinha(null);
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
            <div className="topbar-actions">
              <button
                type="button"
                className="secondary-button small-button"
                onClick={() => printFigurinhas()}
              >
                Imprimir
              </button>
              <button
                type="button"
                className="secondary-button small-button"
                onClick={printFigurinhasSemQuantidade}
              >
                Imprimir faltantes
              </button>
              <button
                type="button"
                className="secondary-button small-button"
                onClick={exportFigurinhasTxt}
              >
                Imprimir repetidas
              </button>
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <label>
              <span>Filtrar por número</span>
              <input
                type="text"
                value={filterForm.figurinha_id}
                onChange={handleFilterChange("figurinha_id")}
                placeholder="Ex: 42"
              />
            </label>

            <label>
              <span>Filtrar por nome</span>
              <input
                type="text"
                value={filterForm.nome_jogador}
                onChange={handleFilterChange("nome_jogador")}
                placeholder="Ex: Neymar"
              />
            </label>

            <label>
              <span>Filtrar por categoria</span>
              <select
                value={filterForm.categoria}
                onChange={handleFilterChange("categoria")}
              >
                <option value="">Todas</option>
                <option value="CINQUENTÃO">CINQUENTÃO</option>
                <option value="SESSENTÃO">SESSENTÃO</option>
                <option value="SETENTÃO">SETENTÃO</option>
              </select>
            </label>

            <label>
              <span>Filtrar por equipe</span>
              <input
                type="text"
                value={filterForm.equipe}
                onChange={handleFilterChange("equipe")}
                placeholder="Ex: Brasil"
              />
            </label>
          </div>

          {list.length === 0 ? (
            <div className="empty-state">
              Nenhuma figurinha cadastrada ainda.
            </div>
          ) : filteredList.length === 0 ? (
            <div className="empty-state">
              Nenhuma figurinha encontrada para os filtros informados.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="figurinha-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Equipe</th>
                    <th>Foto</th>
                    <th>Jogador</th>
                    <th>Categoria</th>
                    <th>Quantidade</th>
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
                      <td>{figurinha.figurinha_id}</td>
                      <td>{figurinha.equipe}</td>
                      <td>
                        {figurinha.foto ? (
                          <img
                            src={figurinha.foto}
                            alt={figurinha.nome_jogador}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{figurinha.nome_jogador}</td>
                      <td>{figurinha.categoria}</td>
                      <td>{figurinha.quantidade}</td>
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
                <span>Número</span>
                <strong>{selectedFigurinha.figurinha_id}</strong>
              </div>
              <div>
                <span>Equipe</span>
                <strong>{selectedFigurinha.equipe}</strong>
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
                <strong>{selectedFigurinha.quantidade}</strong>
              </div>
            </div>

            {selectedFigurinha.foto && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={selectedFigurinha.foto}
                  alt={selectedFigurinha.nome_jogador}
                  style={{
                    maxWidth: 180,
                    maxHeight: 180,
                    objectFit: "contain",
                  }}
                />
              </div>
            )}

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
                ? `Deseja alterar a figurinha ${confirmFigurinha.figurinha_id} - ${confirmFigurinha.nome_jogador}?`
                : `Deseja excluir a figurinha ${confirmFigurinha.figurinha_id} - ${confirmFigurinha.nome_jogador}?`}
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
