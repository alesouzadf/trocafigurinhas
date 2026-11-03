import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AuthGuard } from "./auth.guard";
import { CreateFigurinhaDto, UpdateFigurinhaDto } from "./dto";
import { FigurinhasService } from "./figurinhas.service";

@Controller("figurinhas")
@UseGuards(AuthGuard)
export class FigurinhasController {
  constructor(private readonly figurinhasService: FigurinhasService) {}

  @Get()
  async list(@Req() req: Request & { user: { sub: number } }) {
    return this.figurinhasService.listByUser(req.user.sub);
  }

  @Post()
  async create(
    @Req() req: Request & { user: { sub: number } },
    @Body() dto: CreateFigurinhaDto,
  ) {
    return this.figurinhasService.create(req.user.sub, dto);
  }

  @Patch(":id")
  async update(
    @Req() req: Request & { user: { sub: number } },
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateFigurinhaDto,
  ) {
    return this.figurinhasService.update(req.user.sub, id, dto);
  }

  @Delete(":id")
  async remove(
    @Req() req: Request & { user: { sub: number } },
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.figurinhasService.remove(req.user.sub, id);
  }
}
