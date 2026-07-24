import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NegociosService } from '../services/negocios.service';
import { CreateNegocioDto } from '../dto/negocios/create-negocio.dto';
import { UpdateNegocioDto } from '../dto/negocios/update-negocio.dto';

@Controller('negocios')
export class NegociosController {
  constructor(private readonly negociosService: NegociosService) {}

  @Post()
  create(@Body() createNegocioDto: CreateNegocioDto) {
    return this.negociosService.create(createNegocioDto);
  }

  @Get()
  findAll() {
    return this.negociosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.negociosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNegocioDto: UpdateNegocioDto) {
    return this.negociosService.update(id, updateNegocioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.negociosService.remove(id);
  }
}
