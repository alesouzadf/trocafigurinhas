import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { supabase } from "../config/supabase";
import { LoginDto, RegisterDto } from "./dto";

@Injectable()
export class AuthService {
  async register(dto: RegisterDto) {
    const existing = await supabase
      .from("usuario")
      .select("id")
      .eq("email", dto.email)
      .maybeSingle();

    if (existing.error) {
      throw new BadRequestException(existing.error.message);
    }

    if (existing.data) {
      throw new BadRequestException("Usuário já cadastrado com este e-mail.");
    }

    const passwordHash = await hash(dto.senha, 10);
    const { data, error } = await supabase
      .from("usuario")
      .insert({
        nome: dto.nome,
        email: dto.email,
        senha: passwordHash,
        telefone: dto.telefone,
      })
      .select("id, nome, email, telefone")
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    const token = this.generateToken(data.id, data.email);
    return { token, user: data };
  }

  async login(dto: LoginDto) {
    const { data, error } = await supabase
      .from("usuario")
      .select("*")
      .eq("email", dto.email)
      .single();

    if (error || !data) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const passwordMatches = await compare(dto.senha, data.senha);
    if (!passwordMatches) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const token = this.generateToken(data.id, data.email);
    return {
      token,
      user: {
        id: data.id,
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
      },
    };
  }

  private generateToken(userId: number | string, email: string) {
    const jwtSecret = process.env.JWT_SECRET || "troca-figurinhas-secret";
    return sign({ sub: Number(userId), email }, jwtSecret, { expiresIn: "7d" });
  }
}
