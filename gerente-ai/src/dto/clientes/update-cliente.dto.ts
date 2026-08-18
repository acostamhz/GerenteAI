import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';

export class UpdateClienteDto extends PartialType(
  OmitType(CreateClienteDto, ['sedeId'] as const),
) {}