import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

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
      req.schoolId = school?.id; // Assign the school id to a new property
      next();
    } catch (error) {
      // Handle errors accordingly
      next(error);
    }
  }
}
