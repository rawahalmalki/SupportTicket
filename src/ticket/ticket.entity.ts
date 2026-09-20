import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticketId: string;

  @Column()
  ticketName: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  ticketSubject: string;

  @Column('text')
  ticketDescription: string;

  @Column({
    type: 'enum',
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  })
  ticketStatus: 'open' | 'in-progress' | 'resolved' | 'closed';

  @Column({ nullable: true })
  clickupId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}