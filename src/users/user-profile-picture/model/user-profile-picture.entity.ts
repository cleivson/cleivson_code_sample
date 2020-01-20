import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from 'users';

@Entity()
export class UserProfilePicture {

  /**
   * The binary file representing the profile picture.
   */
  @Column({ type: 'mediumblob', nullable: true })
  picture: ArrayBufferLike;

  @PrimaryColumn()
  userId: number;

  @JoinColumn()
  @OneToOne(type => User, { onDelete: 'CASCADE' })
  user?: User;

}
