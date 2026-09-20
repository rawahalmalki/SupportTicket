import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { Ticket } from './ticket.entity.js';
import { TicketService } from './services/ticket.service.js';
import { promises } from 'dns';

@Controller('ticket')
export class TicketController {
    constructor(private readonly ticketService:TicketService){}


@Post('')
postTicket(@Body() createTicketDto:CreateTicketDto): Promise<Ticket> {
    return this.ticketService.postTicket(createTicketDto);
}

 @Delete(':id')
  async deleteTicket(@Param('id') id: string): Promise<void> {
    return this.ticketService.deleteTicket(id);
  }

@Get('')
listTickets():Promise<Ticket[]>{
    return this.ticketService.listTickets();
}



 @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any): Promise<{ success: boolean }> {
    try {
      await this.ticketService.handleWebhook(payload);
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Webhook processing failed:', error.message);
      } else {
        console.error('An unexpected error occurred', String(error));
      }
      return { success: false };
    }
  }

}


{/*@Patch(':id')
async updateStatus(
  @Param('id') id: string,
  @Body('ticketStatus') status: Ticket['ticketStatus'], 
): Promise<Ticket> {
  return this.ticketService.updateStatus(id, status);
}*/}
