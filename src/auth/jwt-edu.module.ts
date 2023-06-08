import { Module, Global } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../common/constants';

@Global()
@Module({
  imports: [
    NestJwtModule.register({
      global: true,
      secret: jwtConstants.secret,
    }),
  ],
  exports: [NestJwtModule],
})
export class JwtEduModule {}
