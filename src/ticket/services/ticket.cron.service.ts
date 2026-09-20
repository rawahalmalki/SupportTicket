import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Ticket } from '../ticket.entity.js';
import { ClickUpService } from './clickup.service.js';

@Injectable()
export class TicketCronService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private clickUpService: ClickUpService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncTicketsToClickUp() {
    console.log('Starting sync: Sending tickets without ClickUp ID...');

    try {
      const ticketsWithoutClickUpId = await this.ticketRepository.find({
        where: { clickupId: IsNull() },
      });

      if (ticketsWithoutClickUpId.length === 0) {
        console.log('No tickets to sync to ClickUp');
        return;
      }

      console.log(
        `Found ${ticketsWithoutClickUpId.length} tickets to sync to ClickUp`,
      );

      for (const ticket of ticketsWithoutClickUpId) {
        try {
          const clickupTask = await this.clickUpService.createTaskFromTicket(ticket);
          ticket.clickupId = clickupTask.id;
          await this.ticketRepository.save(ticket);
          console.log(
            `Successfully synced ticket ${ticket.ticketId} to ClickUp (Task ID: ${clickupTask.id})`,
          );
        } catch (error) {
          if (error instanceof Error) {
            console.error(`Failed to sync ticket ${ticket.ticketId} to ClickUp: ${error.message}`);
          } else {
            console.error('An unexpected error occurred', String(error));
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error during ClickUp sync job: ${error.message}`, error.stack);
      } else {
        console.error('An unexpected error occurred', String(error));
      }
    }
  }
}