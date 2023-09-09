import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import * as mustache from 'mustache';
import * as puppeteer from 'puppeteer';
import { exportStudentReport } from '../templates/student-report-template';
import { StudentResultService } from '../student/studentResult.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  StudentExam,
  StudentExamDocument,
} from '../student/schemas/studentExam.schema';
import { Model } from 'mongoose';

@Injectable()
export class ReportService {
  constructor(
    private readonly studentResultService: StudentResultService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

  async createReportStudent(
    @Res() res: Response,
    studentId: string,
  ): Promise<void> {
    const fileName = `report.pdf`;

    const chart: any = await this.studentResultService.examsChart(studentId);
    const planetChart: any = await this.studentResultService.planetsChart(
      studentId,
    );

    const studentExams = await this.studentExamModel.findOne({
      studentId: studentId,
      examPerformed: true,
    });

    const planetsPerformance =
      await this.studentResultService.getStudentPlanetsResultDetail(
        studentExams.id,
        true,
      );

    const data = await this.studentResultService.getStudentDetailedSummary(
      studentId,
    );

    // Renderize o conteúdo do relatório usando o modelo Mustache
    const content = exportStudentReport(chart, planetChart);
    const html = mustache.render(content, {
      summaries: data.summaries,
      performanceByArea: data.performanceByArea,
      planetsPerformance: planetsPerformance,
    });

    // Configurar o cabeçalho da resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    try {
      // Inicialize o navegador Puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Carregue o HTML na página Puppeteer
      await page.setContent(html);

      // Gere o PDF a partir do HTML
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '1.5cm',
          right: '1.5cm',
          bottom: '1.5cm',
          left: '1.5cm',
        },
      });

      // Encaminhe o PDF para a resposta
      res.send(pdfBuffer);

      // Feche o navegador Puppeteer
      await browser.close();
    } catch (error) {
      // Trate erros aqui
      res.status(500).send('Erro ao gerar o PDF');
    }
  }
}
