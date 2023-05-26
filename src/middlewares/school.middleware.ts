import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolMiddleware implements NestMiddleware {
  constructor(private readonly prismaService: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const school = await this.prismaService.school.findFirst({
        select: {
          id: true,
        },
      });
      if (school) {
        req['schoolId'] = school.id;
      }
      next();
    } catch (error) {
      next(error);
    }
  }
}
