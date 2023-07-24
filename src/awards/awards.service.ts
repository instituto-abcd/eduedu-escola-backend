import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Award } from '@prisma/client';
import { AwardDto } from './dto/awards.dto';
import { CreateAwardDto } from './dto/create-award.dto';

@Injectable()
export class AwardsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAward(createAwardDto: CreateAwardDto): Promise<AwardDto> {
    const { name } = createAwardDto;

    const createdAward = await this.prisma.award.create({
      data: {
        name,
      },
    });

    return { id: createdAward.id, name: createdAward.name };
  }

  async getStudentAwards(studentId: string): Promise<Award[]> {
    const studentAwards = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { studentAwards: { include: { award: true } } },
    });

    if (!studentAwards) {
      throw new NotFoundException('Estudante não encontrado.');
    }

    return studentAwards.studentAwards.map((sa) => sa.award);
  }
}
