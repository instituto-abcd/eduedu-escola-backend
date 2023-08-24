import { Injectable } from "@nestjs/common";
import { StudentPerformanceDefinitionDto } from "./dto/student-performance-definition.dto";

@Injectable()
export class PerformanceResultUtilsService {

    private veryLowText = 'Muito abaixo';
    private veryLowColor = '#C92A2A';
    private belowText = 'Abaixo';
    private belowColor = '#FF922B';
    private expectedText = 'Esperado';
    private expectedColor = '#2F9E44';

    private children: { [key: string] : StudentPerformanceDefinitionDto } = {};
    private firstYear: { [key: string] : StudentPerformanceDefinitionDto } = {};
    private secondYear: { [key: string] : StudentPerformanceDefinitionDto } = {};
    private thirdYear: { [key: string] : StudentPerformanceDefinitionDto } = {};

    constructor() {
        this.children["0"] = { color: this.veryLowColor, description: this.veryLowText };
        this.children["1"] = { color: this.belowColor, description: this.belowText };
        this.children["IDEAL"] = { color: this.expectedColor, description: this.expectedText };

        this.firstYear["0"] = { color: this.veryLowColor, description: this.veryLowText };
        this.firstYear["1"] = { color: this.veryLowColor, description: this.veryLowText };
        this.firstYear["2"] = { color: this.belowColor, description: this.belowText };
        this.firstYear["IDEAL"] = { color: this.expectedColor, description: this.expectedText };

        this.secondYear["0"] = { color: this.veryLowColor, description: this.veryLowText };
        this.secondYear["1"] = { color: this.veryLowColor, description: this.veryLowText };
        this.secondYear["2"] = { color: this.veryLowColor, description: this.veryLowText };
        this.secondYear["3"] = { color: this.belowColor, description: this.belowText };
        this.secondYear["IDEAL"] = { color: this.expectedColor, description: this.expectedText };

        this.thirdYear["0"] = { color: this.veryLowColor, description: this.veryLowText };
        this.thirdYear["1"] = { color: this.veryLowColor, description: this.veryLowText };
        this.thirdYear["2"] = { color: this.veryLowColor, description: this.veryLowText };
        this.thirdYear["3"] = { color: this.veryLowColor, description: this.veryLowText };
        this.thirdYear["4"] = { color: this.belowColor, description: this.belowText };
        this.thirdYear["IDEAL"] = { color: this.expectedColor, description: this.expectedText };
    }

    getStudentPerformanceDefinition(schoolGradeYear: number, level: string): StudentPerformanceDefinitionDto {
        switch (schoolGradeYear) {
            case 0:
                return this.children[level];
            case 1:
                return this.firstYear[level];
            case 2:
                return this.secondYear[level];
            case 3:
                return this.thirdYear[level];
            default:
                break;
        }
    }
}