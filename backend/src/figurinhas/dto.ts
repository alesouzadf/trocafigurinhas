import { IsInt, IsOptional, Min } from "class-validator";

export class CreateFigurinhaDto {
  @IsInt()
  @Min(1)
  figurinha_id!: number;

  @IsInt()
  @Min(0)
  quantidade!: number;
}

export class UpdateFigurinhaDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantidade?: number;
}
