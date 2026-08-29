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

// El guard va en el controlador, no por método: así un endpoint nuevo
// nace protegido y no queda abierto por olvidar el decorador.
@Controller('abonos')
@UseGuards(JwtAuthGuard)
export class AbonosController {
  constructor(private readonly abonosService: AbonosService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAbonoDto) {
    return this.abonosService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('sedeId') sedeId?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.abonosService.findAll(
      user.userId,
      user.rolGlobal,
      sedeId,
      clienteId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.abonosService.findOne(id, user.userId, user.rolGlobal);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.abonosService.remove(id, user.userId, user.rolGlobal);
  }
}
