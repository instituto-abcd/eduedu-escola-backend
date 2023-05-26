export interface CreateUserDto {
  name: string;
  email: string;
  document: string;
  profile: string;
  schoolId?: string;
}
