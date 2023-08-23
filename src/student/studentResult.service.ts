import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { StudentExam, StudentExamDocument } from "./schemas/studentExam.schema";
import { Model } from "mongoose";
import { PrismaService } from "src/prisma/prisma.service";
import { StudentPlanetResultDetailDto } from "./dto/student-planet-result-detail.dto";
import { StudentDetailedSummaryDto } from "./student-detailed-summary.dto";
import { StudentService } from "./student.service";

@Injectable()
export class StudentResultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentService: StudentService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

  async getStudentDetailedSummary(
    studentId: string,
  ): Promise<StudentDetailedSummaryDto> {
    let result = new StudentDetailedSummaryDto();
    const studentExam = await this.studentExamModel.findOne({ studentId: studentId, current: true });

    let studentExamResults = await this.prisma.studentExamResult.findMany({
      where: { studentId: studentId, examId: studentExam.examId }
    });

    const axisList = [];
    let studentSchoolGradeYear = await this.studentService.getSchoolGradeYear(studentId);

    if (studentSchoolGradeYear == 0) {
      axisList.push({ axisCode: "ES", axisName: "Consciência Fonológica" });
      axisList.push({ axisCode: "EA", axisName: "Sistema de Escrita Alfabética" });
    } else {
      axisList.push({ axisCode: "ES", axisName: "Consciência Fonológica" });
      axisList.push({ axisCode: "EA", axisName: "Sistema de Escrita Alfabética" });
    }

    axisList.push({ axisCode: "LC", axisName: "Leitura e Compreensão do Texto" });    

    axisList.forEach((axis) => {
      let studentExamResult = studentExamResults.find((result) => result.axisCode == axis.axisCode);

      result.performanceByArea.push({
        axisCode: axis.axisCode,
        axisName: axis.axisName,
        percent: +studentExamResult.percent,
      });

      result.summaries.push({
        axisCode: axis.axisCode,
        summary: studentExamResult.resume,
      })
    });

    return result;
  }

  async getStudentPlanetsResultDetail(
    studentExamId: string,
    loadPlanets: boolean
  ): Promise<StudentPlanetResultDetailDto[]> {
    let result: StudentPlanetResultDetailDto[] = [];
    const studentExam = await this.studentExamModel.findById(studentExamId);

    result.push(await this.getStudentPlanetResultDetail(studentExam, loadPlanets, "ES", "Consciência Fonológica"));
    result.push(await this.getStudentPlanetResultDetail(studentExam, loadPlanets, "EA", "Sistema de Escrita Alfabética"));
    result.push(await this.getStudentPlanetResultDetail(studentExam, loadPlanets, "LC", "Leitura e Compreensão do Texto"));

    return result;
  }

  private async getStudentPlanetResultDetail(
    studentExam: StudentExamDocument,
    loadPlanets: boolean,
    axisCode: string,
    axisName: string
  ): Promise<StudentPlanetResultDetailDto> {
    const studentPlanetResult = await this.prisma.studentPlanetResult.findMany({
        where: { studentId: studentExam.studentId, axisCode: axisCode }
    });

    let planetResultDetail = new StudentPlanetResultDetailDto();
    planetResultDetail.axisCode = axisCode;
    planetResultDetail.axisName = axisName;
    planetResultDetail.offeredPlanets = studentExam.planetTrack.filter(item => item.axis_code == axisCode).length;
    planetResultDetail.accomplishedPlanets = studentPlanetResult.length;
    let averageStars = (studentPlanetResult.reduce((a, u) => a + +u.stars, 0) / studentPlanetResult.length);
    planetResultDetail.averageStars = !isNaN(averageStars) ? averageStars : 0;
    planetResultDetail.planets = (/true/).test(loadPlanets.toString()) == true ? studentPlanetResult.map(item => {
        return { planetId: item.planetId, planetName: item.planetName, stars: +item.stars }
    }) : [];

    return planetResultDetail;
  }
  
}