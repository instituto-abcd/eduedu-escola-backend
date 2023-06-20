import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { EduException } from '../common/exceptions/edu-school.exception';

interface CustomRequest extends Request {
  schoolId?: string;
}

@Injectable()
export class SchoolMiddleware implements NestMiddleware {
  constructor(private readonly prismaService: PrismaService) {}

  async use(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const school = await this.prismaService.school.findFirst({
        select: {
          id: true,
        },
      });

      if (!school) {
        return next(new EduException('SCHOOL_NOT_FOUND'));
      }

      req.schoolId = school.id;
      next();
    } catch (error) {
      next(new EduException('UNKNOWN_ERROR'));
    }
  }
}
