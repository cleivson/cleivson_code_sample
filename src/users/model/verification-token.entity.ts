import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class VerificationToken {
  constructor(user: User, expirationDate: Date) {
    this.user = user;
    this.expirationDate = expirationDate;
  }

  @PrimaryGeneratedColumn('uuid')
  token?: string;

  @Column({type: 'datetime'})
  expirationDate: Date;

  @JoinColumn()
  @OneToOne(type => User, { eager: true })
  user: User;

}
