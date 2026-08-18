import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SedesService } from '../services/sedes.service';
import { CreateSedeDto } from '../dto/sedes/create-sede.dto';
import { UpdateSedeDto } from '../dto/sedes/update-sede.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

@Controller('sedes')
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSedeDto) {
    return this.sedesService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(
    @Query('negocioId') negocioId?: string,
    @Query('telefono') telefono?: string,
  ) {
    return this.sedesService.findAll(negocioId, telefono);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sedesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateSedeDto,
  ) {
    return this.sedesService.update(id, user.userId, user.rolGlobal, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.sedesService.remove(id, user.userId, user.rolGlobal);
  }
}
