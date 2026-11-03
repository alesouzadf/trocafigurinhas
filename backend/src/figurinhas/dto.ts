import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateFigurinhaDto {
  @IsString()
  @IsNotEmpty()
  time!: string;

  @IsInt()
  @Min(50)
  @Max(70)
  categoria!: number;

  @IsString()
  @IsNotEmpty()
  nome_jogador!: string;

  @IsInt()
  @Min(0)
  quantidade_repetidas!: number;
}

export class UpdateFigurinhaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  time?: string;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(70)
  categoria?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome_jogador?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantidade_repetidas?: number;
}
