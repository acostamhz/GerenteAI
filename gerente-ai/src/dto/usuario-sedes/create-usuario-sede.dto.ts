import { IsNotEmpty, IsString } from 'class-validator';

// Sin campo `role`: el enum Role solo tiene ADMIN, así que se deja el default de Prisma.
// Quien queda vinculado a la sede es su administrador, y solo de esa sede.
export class CreateUsuarioSedeDto {
  @IsString()
  @IsNotEmpty()
  usuarioId!: string;

  @IsString()
  @IsNotEmpty()
  sedeId!: string;
}
