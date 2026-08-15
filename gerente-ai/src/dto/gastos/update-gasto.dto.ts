import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGastoDto } from './create-gasto.dto';

export class UpdateGastoDto extends PartialType(
  OmitType(CreateGastoDto, ['sedeId'] as const),
) {}