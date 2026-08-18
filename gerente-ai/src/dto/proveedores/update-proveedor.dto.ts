import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProveedorDto } from './create-proveedor.dto';

export class UpdateProveedorDto extends PartialType(
  OmitType(CreateProveedorDto, ['sedeId'] as const),
) {}