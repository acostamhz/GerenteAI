import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AbonosService } from '../services/abonos.service';
import { CreateAbonoDto } from '../dto/abonos/create-abono.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

@Controller('abonos')
export class AbonosController {
  constructor(private readonly abonosService: AbonosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAbonoDto) {
    return this.abonosService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(
    @Query('sedeId') sedeId?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.abonosService.findAll(sedeId, clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.abonosService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.abonosService.remove(id, user.userId, user.rolGlobal);
  }
}
