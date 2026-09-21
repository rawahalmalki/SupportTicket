import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Ticket } from '../ticket.entity.js';

@Injectable()
export class ClickUpService {
  private readonly clickupApiUrl = 'https://api.clickup.com/api/v2';
  private readonly clickupApiKey: string;
  private readonly clickupListId: string;
  private readonly clickupTeamId: string;


  constructor() {
    this.clickupApiKey = process.env.CLICKUP_API_KEY || '';
    this.clickupListId = process.env.CLICKUP_LIST_ID || '';
    this.clickupTeamId = process.env.CLICKUP_TEAM_ID || '';
  }
   
async createTaskFromTicket(ticket: Ticket): Promise<any> {
  const response = await axios.post(
    `${this.clickupApiUrl}/list/${this.clickupListId}/task`,
    {
      name: ticket.ticketSubject,
      description: `From: ${ticket.ticketName} (${ticket.email})\n\nMessage:\n${ticket.ticketDescription}`,
    },
    {
      headers: {
        Authorization: this.clickupApiKey,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data;
}

async createWebhook(endpoint: string): Promise<any> {
  try {
    const response = await axios.post(
      `${this.clickupApiUrl}/team/${this.clickupTeamId}/webhook`,
      {
        endpoint,
        events: ['taskStatusUpdated'],
      },
      {
        headers: {
          Authorization: this.clickupApiKey,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(`Webhook created successfully: ${endpoint}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to create webhook:', error.message);
    } else {
      console.error('An unexpected error occurred', String(error));
    }
    throw error;
  }
}

async getWebHooks(): Promise<any[]> {
  try {
    const response = await axios.get(
      `${this.clickupApiUrl}/team/${this.clickupTeamId}/webhook`,
      {
        headers: {
          Authorization: this.clickupApiKey,
        },
      },
    );
    return response.data.webhooks || [];
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to get webhooks:', error.message);
    } else {
      console.error('An unexpected error occurred', String(error));
    }
    return [];
  }
}

async deleteWebhook(webhookId: string): Promise<void> {
  try {
    await axios.delete(`${this.clickupApiUrl}/webhook/${webhookId}`, {
      headers: {
        Authorization: this.clickupApiKey,
      },
    });
    console.log(`Webhook deleted: ${webhookId}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to delete webhook:', error.message);
    } else {
      console.error('An unexpected error occurred', String(error));
    }
    throw error;
  }
}

async deletTaskById(taskId: string): Promise<any> {
  try {
    const response = await axios.delete(`${this.clickupApiUrl}/task/${taskId}`, {
      headers: {
        Authorization: this.clickupApiKey,
      },
    });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to delete task ${taskId}:`, error.message);
    } else {
      console.error('An unexpected error occurred', String(error));
    }
    throw error;
  }
}
}
