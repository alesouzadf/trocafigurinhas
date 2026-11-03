import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verify } from "jsonwebtoken";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token de autenticação ausente.");
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = verify(
        token,
        process.env.JWT_SECRET || "troca-figurinhas-secret",
      ) as unknown;

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("sub" in payload) ||
        !("email" in payload)
      ) {
        throw new UnauthorizedException("Token inválido.");
      }

      req.user = {
        sub: Number((payload as { sub: number | string }).sub),
        email: String((payload as { email: string }).email),
      };
      return true;
    } catch {
      throw new UnauthorizedException("Token inválido.");
    }
  }
}
