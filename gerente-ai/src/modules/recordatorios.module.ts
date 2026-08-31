import { Module } from '@nestjs/common';
import { RecordatoriosController } from '../controllers/recordatorios.controller';
import { RecordatoriosService } from '../services/recordatorios.service';
import { MailModule } from '../auth/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [RecordatoriosController],
  providers: [RecordatoriosService],
  exports: [RecordatoriosService],
})
export class RecordatoriosModule {}
