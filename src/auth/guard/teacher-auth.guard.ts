import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EduAuthGuard } from './edu-auth.guard';

@Injectable()
export class TeacherAuthGuard extends EduAuthGuard {
  constructor(jwtService: JwtService) {
    super(jwtService, 'TEACHER', false);
  }
}
