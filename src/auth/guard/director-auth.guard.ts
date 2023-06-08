import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EduAuthGuard } from './edu-auth.guard';

@Injectable()
export class DirectorAuthGuard extends EduAuthGuard {
  constructor(jwtService: JwtService) {
    super(jwtService, 'DIRECTOR', false);
  }
}
