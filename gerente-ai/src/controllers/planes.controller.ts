import { Controller, Get } from '@nestjs/common';
import { PlanesService } from '../services/planes.service';

// Catalogo publico: son los precios que el frontend muestra en la pantalla de
// suscripcion, antes de que exista una sesion. Por eso no lleva guard.
@Controller('planes')
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  @Get()
  catalogo() {
    return this.planesService.catalogo();
  }
}
