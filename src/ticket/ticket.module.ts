import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketController } from './ticket.controller.js';
import { Ticket } from './ticket.entity.js';
import { ClickUpService } from './services/clickup.service.js';
import { TicketCronService } from './services/ticket.cron.service.js';
import { TicketService } from './services/ticket.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [TicketController],
  providers: [TicketService, ClickUpService, TicketCronService],
})
export class TicketModule implements OnModuleInit {
  private readonly logger = new Logger(TicketModule.name);

  constructor(private readonly clickUpService: ClickUpService) {}

  async onModuleInit() {
    await this.setupWebhook();
  }

  private async setupWebhook() {
    try {
      const webhookUrl = process.env.WEBHOOK_URL || '';

      if (!webhookUrl) {
        this.logger.warn('No webhook URL configured. Skipping webhook setup.');
        return;
      }

      const fullWebhookUrl = `${webhookUrl}/ticket/webhook`;
      this.logger.log(`Setting up webhook for: ${fullWebhookUrl}`);

      const webhooks = await this.clickUpService.getWebHooks();
      const existingWebhook = webhooks.find(
        (webhook) => webhook.endpoint === fullWebhookUrl,
      );

      if (!existingWebhook) {
        this.logger.log('No existing webhook found. Creating new webhook...');
        await this.clickUpService.createWebhook(fullWebhookUrl);
      }

      const ngrokOldHooks = webhooks.filter(
        (webhook) =>
          webhook.endpoint.includes('ngrok') &&
          webhook.endpoint !== fullWebhookUrl,
      );
      for (const oldHook of ngrokOldHooks) {
        this.logger.log(`Deleting old ngrok webhook: ${oldHook.id}`);
        await this.clickUpService.deleteWebhook(oldHook.id);
      }
    } catch (error){
       if (error instanceof Error) {
        this.logger.error('Failed to setup webhook:', error.message);
      } else {
        this.logger.error('An unexpected error occurred', String(error));
      }
    }
  }
}

