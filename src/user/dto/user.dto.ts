import { Profile, Status } from '@prisma/client';

export interface ResponseUserDto {
  id: string;
  status: Status;
  name: string;
  email: string;
  document: string;
  profile: Profile;
}
