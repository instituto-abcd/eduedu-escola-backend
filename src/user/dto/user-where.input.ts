export class UserWhereInput {
  name?: StringFilter;
  email?: StringFilter;
  document?: StringFilter;
  profile?: Profile;
}

class StringFilter {
  contains: string;
  mode: QueryMode;
}

enum Profile {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

enum QueryMode {
  SENSITIVE = 'sensitive',
  INSENSITIVE = 'insensitive',
}
