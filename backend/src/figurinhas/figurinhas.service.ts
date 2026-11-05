import { Injectable, NotFoundException } from "@nestjs/common";
import { supabase } from "../config/supabase";
import { CreateFigurinhaDto, UpdateFigurinhaDto } from "./dto";

@Injectable()
export class FigurinhasService {
  async listByUser(userId: number | string) {
    const { data, error } = await supabase
      .from("figurinhas")
      .select("*")
      .eq("usuario_id", Number(userId))
      .order("figurinha_id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];

    const enriched = [] as Record<string, any>[];
    for (const row of rows) {
      const figurinha = await this.fetchFigurinhaDetails(
        Number(row.figurinha_id),
      );
      enriched.push({
        id: row.id,
        figurinha_id: row.figurinha_id,
        quantidade: row.quantidade ?? 0,
        equipe: figurinha?.equipe ?? "",
        foto: figurinha?.foto ?? "",
        nome_jogador: figurinha?.nome_jogador ?? "",
        categoria: figurinha?.categoria ?? "",
      });
    }

    return enriched;
  }

  async findCatalogFigurinha(figurinhaId: number | string) {
    const figurinha = await this.fetchFigurinhaDetails(Number(figurinhaId));

    if (!figurinha) {
      throw new NotFoundException("Figurinha não encontrada.");
    }

    return figurinha;
  }

  async create(userId: number | string, dto: CreateFigurinhaDto) {
    await this.ensureUserExists(userId);

    const payload = this.buildCollectionPayload(userId, {
      figurinha_id: dto.figurinha_id,
      quantidade: dto.quantidade,
    });

    const { data, error } = await supabase
      .from("figurinhas")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.normalizeRow(data) as Record<string, any>;
  }

  async update(
    userId: number | string,
    id: number | string,
    dto: UpdateFigurinhaDto,
  ) {
    await this.ensureUserExists(userId);

    const existing = (await this.ensureBelongsToUser(userId, id)) as Record<
      string,
      any
    >;

    const payload = this.buildCollectionPayload(userId, {
      ...(dto.quantidade !== undefined ? { quantidade: dto.quantidade } : {}),
    });

    const { data, error } = await supabase
      .from("figurinhas")
      .update(payload)
      .eq("id", Number(id))
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.normalizeRow({ ...existing, ...data }) as Record<string, any>;
  }

  async remove(userId: number | string, id: number | string) {
    const existing = (await this.ensureBelongsToUser(userId, id)) as Record<
      string,
      any
    >;

    const { error } = await supabase
      .from("figurinhas")
      .delete()
      .eq("id", Number(id));

    if (error) {
      throw new Error(error.message);
    }

    return { deleted: true, id: existing.id };
  }

  private buildCollectionPayload(
    userId: number | string,
    payload: Record<string, any>,
  ) {
    const nextPayload = { ...payload };

    if (userId !== undefined && userId !== null && userId !== "") {
      nextPayload.usuario_id = Number(userId);
    }

    return nextPayload;
  }

  private async ensureUserExists(userId: number | string) {
    const { data, error } = await supabase
      .from("usuario")
      .select("id")
      .eq("id", Number(userId))
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException(
        "Usuário autenticado não encontrado na base de dados.",
      );
    }
  }

  private async fetchFigurinhaDetails(figurinhaId: number) {
    const { data, error } = await supabase
      .from("figurinha")
      .select("id, nome_jogador, img_jogador, equipe, categoria")
      .eq("id", figurinhaId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      figurinha_id: data.id,
      nome_jogador: data.nome_jogador ?? "",
      foto: data.img_jogador ?? "",
      equipe: data.equipe ?? "",
      categoria: data.categoria ?? "",
    };
  }

  private normalizeRow(row: Record<string, any> | null | undefined) {
    if (!row) return row;

    return {
      id: row.id,
      figurinha_id: row.figurinha_id ?? row.figurinhaId ?? null,
      quantidade: row.quantidade ?? row.quantidade_repetidas ?? 0,
      equipe: row.equipe ?? "",
      foto: row.foto ?? row.img_jogador ?? "",
      nome_jogador: row.nome_jogador ?? "",
      categoria: row.categoria ?? "",
    };
  }

  private async ensureBelongsToUser(
    userId: number | string,
    id: number | string,
  ) {
    const { data, error } = await supabase
      .from("figurinhas")
      .select("*")
      .eq("id", Number(id))
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException("Figurinha não encontrada.");
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "usuario_id") &&
      data.usuario_id !== null &&
      Number(data.usuario_id) !== Number(userId)
    ) {
      throw new NotFoundException(
        "Figurinha não encontrada para este usuário.",
      );
    }

    return this.normalizeRow(data) as Record<string, any>;
  }
}
