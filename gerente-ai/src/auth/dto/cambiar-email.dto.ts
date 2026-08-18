import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CambiarEmailDto {
  @IsEmail()
  nuevoEmail!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}