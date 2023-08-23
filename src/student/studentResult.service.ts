import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { StudentExam, StudentExamDocument } from "./schemas/studentExam.schema";
import { Model } from "mongoose";
import { PrismaService } from "src/prisma/prisma.service";
import { StudentPlanetResultDetailDto } from "./dto/student-planet-result-detail.dto";

@Injectable()
export class StudentResultService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(StudentExam.name)
    private studentExamModel: Model<StudentExamDocument>,
  ) {}

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