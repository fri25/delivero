import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JetonInviteService } from './jeton-invite.service';
import { ConsoleMessagerie, Messagerie } from './messagerie';
import { TwilioMessagerie } from './twilio-messagerie';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

// Global like RealtimeModule: used by the 4 order modules, payments and auth
// (OTP) without cross-imports.
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    JetonInviteService,
    {
      provide: Messagerie,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Messagerie => {
        const fournisseur = config.get<string>('MESSAGERIE_FOURNISSEUR');
        if (fournisseur === 'twilio') {
          return new TwilioMessagerie({
            accountSid: config.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
            authToken: config.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
            expediteurSms: config.getOrThrow<string>('TWILIO_SMS_FROM'),
            expediteurWhatsApp:
              config.get<string>('TWILIO_WHATSAPP_FROM') || undefined,
          });
        }
        if (fournisseur !== 'console') {
          throw new Error(
            `MESSAGERIE_FOURNISSEUR="${fournisseur}" non implémenté.`,
          );
        }
        if (config.get<string>('NODE_ENV') === 'production') {
          // The console driver logs OTP codes: never acceptable in production.
          new Logger('Messagerie').error(
            'Fournisseur WhatsApp/SMS "console" en production : aucun message ni code OTP n’est réellement envoyé.',
          );
        }
        return new ConsoleMessagerie();
      },
    },
  ],
  exports: [NotificationsService, Messagerie, JetonInviteService],
})
export class NotificationsModule {}
