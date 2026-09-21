import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../ticket.entity.js';
import { CreateTicketDto } from '../dto/create-ticket.dto.js';
import { ClickUpService } from './clickup.service.js';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private clickUpService: ClickUpService,
  ) {}

  async postTicket(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create(createTicketDto);
    const savedTicket = await this.ticketRepository.save(ticket);

    try {
      const clickupTask = await this.clickUpService.createTaskFromTicket(savedTicket);
      savedTicket.clickupId = clickupTask.id;
      return await this.ticketRepository.save(savedTicket);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to post ticket:', error.message);
      } else {
        console.error('An unexpected error occurred', String(error));
      }
      return savedTicket;
    }
  }

async deleteTicket(id: string): Promise<void> {
  const ticket = await this.ticketRepository.findOne({ where: { ticketId: id } });

  if (!ticket) {
    throw new NotFoundException(`Ticket ${id} not found`);
  }

  if (ticket.clickupId) {
    try {
      await this.clickUpService.deletTaskById(ticket.clickupId);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to delete ClickUp task:', error.message);
      } else {
        console.error('An unexpected error occurred', String(error));
      }
    }
  }
  await this.ticketRepository.delete(id);
}

  async listTickets(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      order: { createdAt: 'DESC' },
    });
  }


  async handleWebhook(payload: any): Promise<void> {
    try {
      const taskId = payload.task_id;
      const newStatus = payload.history_items?.[0]?.after?.status;

      if (!taskId || !newStatus) {
        console.warn('Invalid webhook payload: missing task_id or status');
        return;
      }

      const ticket = await this.ticketRepository.findOne({
        where: { clickupId: taskId },
      });

      if (!ticket) {
        console.warn(`No ticket found for ClickUp task ID: ${taskId}`);
        return;
      }

      const statusMapping: Record<string, Ticket['ticketStatus']> = {
       'not started': 'open',
       'in progress': 'in-progress',
       'resolved': 'resolved',
        'closed': 'closed',
      };

      const mappedStatus = statusMapping[newStatus.toLowerCase()] || ticket.ticketStatus;

      if (mappedStatus !== ticket.ticketStatus) {
        ticket.ticketStatus = mappedStatus;
        await this.ticketRepository.save(ticket);
        console.log(`Updated ticket ${ticket.ticketId} status to ${mappedStatus}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to handle webhook:', error.message);
      } else {
        console.error('An unexpected error occurred', String(error));
      }
      throw error;
    }
  }
}




 
