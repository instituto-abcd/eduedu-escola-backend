import { Profile } from '@prisma/client';

export interface CreateUserDto {
  name: string;
  email: string;
  document: string;
  profile: Profile;
  schoolId?: string;
}
