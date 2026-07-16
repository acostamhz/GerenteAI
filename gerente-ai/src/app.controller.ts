import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      success: true,
      status: 'online',
      service: 'Business AI API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}