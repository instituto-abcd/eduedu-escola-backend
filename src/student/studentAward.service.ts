import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Prisma, StudentExamResult } from "@prisma/client";
import { Model } from "mongoose";
import { AwardType } from "src/awards/enums/award.enum";
import { Exam, ExamDocument } from "src/exam/schemas/exam.schema";
import { PrismaService } from "src/prisma/prisma.service";
import { StudentExam, StudentExamDocument } from "./schemas/studentExam.schema";

@Injectable()
export class StudentAwardService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectModel(Exam.name)
        private examModel: Model<ExamDocument>,
        @InjectModel(StudentExam.name)
        private studentExamModel: Model<StudentExamDocument>,
    ) { }

    async verifyAndGeneratePlanetAwards(studentId: string) {
        let planetsExecuted = await this.prisma.studentPlanetResult.findMany({
            where: { studentId: studentId }
        });

        let planetsExecutedCount = planetsExecuted.length;

        switch (planetsExecutedCount) {
            case 1:
                await this.saveStudentAward(studentId, AwardType.FANTASTICO);
                break;
            case 5: 
                await this.saveStudentAward(studentId, AwardType.LUTADOR);
                break;
            case 10: 
                await this.saveStudentAward(studentId, AwardType.SUPER);
                break;
            case 15: 
                await this.saveStudentAward(studentId, AwardType.INCRIVEL);
                break;
            case 20: 
                await this.saveStudentAward(studentId, AwardType.EXCELENTE);
                break;
            case 25: 
                await this.saveStudentAward(studentId, AwardType.BRILHANTE);
                break;
            case 30: 
                await this.saveStudentAward(studentId, AwardType.GIGANTE);
                break;
            case 30: 
                await this.saveStudentAward(studentId, AwardType.COMPETENTE);
                break;
            case 40: 
                await this.saveStudentAward(studentId, AwardType.BOMBASTICO);
                break;
            case 45: 
                await this.saveStudentAward(studentId, AwardType.SENSACIONAL);
                break;
            case 50: 
                await this.saveStudentAward(studentId, AwardType.PERFEITO);
                break;
            default:
                break;
        }
    }

    async verifyAndGenerateExamAwards(studentId: string) {
        await this.verify_MOTIVADO_award(studentId);
        await this.verify_MAESTRO_award(studentId);
        await this.verify_LEITOR_award(studentId);
        await this.verify_ESCRITOR_award(studentId);
    }

    // Completou 2 avaliações (2 Provas)
    private async verify_MOTIVADO_award(studentId: string) {
        let studentExams = await this.studentExamModel.find({
            studentId: studentId,
            examPerformed: true,
        });

        if (studentExams.length >= 2) {
            await this.saveStudentAward(studentId, AwardType.MOTIVADO);
        }
    }
    
    // Atingiu nível esperado em sistema de escrita alfabética
    private async verify_ESCRITOR_award(studentId: string) {
        const criterionLevel = "IDEAL";
        let result = await this.getStudentExamResults(studentId, 'EA');

        if ((result !== null && result !== undefined) && result.level == criterionLevel) {
            await this.saveStudentAward(studentId, AwardType.ESCRITOR);
        }
    }
    
    // Atingiu nível esperado em leitura e compreensão de texto
    private async verify_LEITOR_award(studentId: string) {
        const criterionLevel = "IDEAL";
        let result = await this.getStudentExamResults(studentId, 'LC');

        if ((result !== null && result !== undefined) && result.level == criterionLevel) {
            await this.saveStudentAward(studentId, AwardType.LEITOR);
        }
    }
    
    // Atingiu nível esperado em consciência fonológica
    private async verify_MAESTRO_award(studentId: string) {
        const criterionLevel = "IDEAL";
        let result = await this.getStudentExamResults(studentId, 'ES');

        if ((result !== null && result !== undefined) && result.level == criterionLevel) {
            await this.saveStudentAward(studentId, AwardType.MAESTRO);
        }
    }

    private async getStudentExamResults(studentId: string, axisCode: string): Promise<StudentExamResult> {
        const studentExam = await this.studentExamModel.findOne({ studentId: studentId, current: true });

        let currentExamId = studentExam.id;
        let studentExamResult = await this.prisma.studentExamResult.findFirst({
            where: {
                studentId: studentId,
                axisCode: axisCode,
                studentExamId: currentExamId
            }
        });

        return studentExamResult;
    }

    private async saveStudentAward(studentId: string, awardType: AwardType) {
        let award = await this.prisma.award.findFirst({
            where: { name: awardType.toLowerCase() }
        });

        await this.prisma.studentAward.upsert({
            where: {
                awardId_studentId: { studentId, awardId: award.id }
            },
            update: {
                studentId,
                awardId: award.id
            },
            create: {
                studentId,
                awardId: award.id
            }
        })
    }

}