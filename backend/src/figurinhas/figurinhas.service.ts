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
      .order("time", { ascending: true })
      .order("nome_jogador", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(
      (item) => this.normalizeRow(item) as Record<string, any>,
    );
  }

  async create(userId: number | string, dto: CreateFigurinhaDto) {
    const { data, error } = await supabase
      .from("figurinhas")
      .insert({
        usuario_id: Number(userId),
        time: dto.time,
        categoria: dto.categoria,
        nome_jogador: dto.nome_jogador,
        quantidade: dto.quantidade_repetidas,
      })
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
    const existing = (await this.ensureBelongsToUser(userId, id)) as Record<
      string,
      any
    >;

    const payload = {
      ...(dto.time !== undefined ? { time: dto.time } : {}),
      ...(dto.categoria !== undefined ? { categoria: dto.categoria } : {}),
      ...(dto.nome_jogador !== undefined
        ? { nome_jogador: dto.nome_jogador }
        : {}),
      ...(dto.quantidade_repetidas !== undefined
        ? { quantidade: dto.quantidade_repetidas }
        : {}),
    };

    const { data, error } = await supabase
      .from("figurinhas")
      .update(payload)
      .eq("id", Number(id))
      .eq("usuario_id", Number(userId))
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
      .eq("id", Number(id))
      .eq("usuario_id", Number(userId));

    if (error) {
      throw new Error(error.message);
    }

    return { deleted: true, id: existing.id };
  }

  private normalizeRow(row: Record<string, any> | null | undefined) {
    if (!row) return row;

    const { quantidade, ...rest } = row;
    return {
      ...rest,
      id: row.id,
      quantidade_repetidas: quantidade ?? row.quantidade_repetidas ?? 0,
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
      .eq("usuario_id", Number(userId))
      .single();

    if (error || !data) {
      throw new NotFoundException(
        "Figurinha não encontrada para este usuário.",
      );
    }

    return this.normalizeRow(data) as Record<string, any>;
  }
}
