import { Injectable } from '@nestjs/common';
import { StudentPerformanceDefinitionDto } from './dto/student-performance-definition.dto';

enum ClassificationType {
  COLOR,
  TEXT
}

@Injectable()
export class PerformanceResultUtilsService {
  private veryLowText = 'Muito abaixo';
  private veryLowColor = '#C92A2A';
  private belowText = 'Abaixo';
  private belowColor = '#FF922B';
  private expectedText = 'Esperado';
  private expectedColor = '#2F9E44';

  getStudentClassificationText(schoolGradeYear: number, axisCode: string, level: string): string {
    switch (schoolGradeYear) {
      case 0:
        return this.getStudentClassification_Children(axisCode, level, ClassificationType.TEXT);
      case 1:
        return this.getStudentClassification_FirstYear(axisCode, level, ClassificationType.TEXT);
      case 2:
        return this.getStudentClassification_SecondYear(axisCode, level, ClassificationType.TEXT);
      case 3:
        return this.getStudentClassification_ThirdYear(axisCode, level, ClassificationType.TEXT);
      default:
        break;
    }
  }

  getStudentClassificationColor(schoolGradeYear: number, axisCode: string, level: string): string {
    switch (schoolGradeYear) {
      case 0:
        return this.getStudentClassification_Children(axisCode, level, ClassificationType.COLOR);
      case 1:
        return this.getStudentClassification_FirstYear(axisCode, level, ClassificationType.COLOR);
      case 2:
        return this.getStudentClassification_SecondYear(axisCode, level, ClassificationType.COLOR);
      case 3:
        return this.getStudentClassification_ThirdYear(axisCode, level, ClassificationType.COLOR);
      default:
        break;
    }
  }

  private getStudentClassification_Children(axisCode: string, level: string, type: ClassificationType): string {
    switch (axisCode) {
      case "ES":
        switch (level) {
          case "0":
          case "1":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      case "EA":
        switch (level) {
          case "0":
          case "1":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      case "LC":
        switch (level) {
          case "0":
          case "1":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      default:
        break;
    }
  }

  private getStudentClassification_FirstYear(axisCode: string, level: string, type: ClassificationType): string {
    switch (axisCode) {
      case "ES":
        switch (level) {
          case "1":
            return type == ClassificationType.TEXT ? this.veryLowText: this.veryLowColor;
          case "2":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      case "EA":
        switch (level) {
          case "1":
            return type == ClassificationType.TEXT ? this.veryLowText: this.veryLowColor;
          case "2":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      case "LC":
        switch (level) {
          case "1":
            return type == ClassificationType.TEXT ? this.veryLowText: this.veryLowColor;
          case "2":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      default:
        break;
    }
  }

  private getStudentClassification_SecondYear(axisCode: string, level: string, type: ClassificationType): string {
    switch (axisCode) {
      case "EA":
        switch (level) {
          case "1":
            return type == ClassificationType.TEXT ? this.veryLowText: this.veryLowColor;
          case "2":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      case "EA":
        switch (level) {
          case "1":
          case "2":
            return type == ClassificationType.TEXT ? this.veryLowText: this.veryLowColor;
          case "3":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      case "LC":
        switch (level) {
          case "1":
          case "2":
            return type == ClassificationType.TEXT ? this.veryLowText: this.veryLowColor;
          case "3":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      default:
        break;
    }
  }

  private getStudentClassification_ThirdYear(axisCode: string, level: string, type: ClassificationType): string {
    switch (axisCode) {
      case "ES":
        switch (level) {
          case "1":
            return type == ClassificationType.TEXT ? this.veryLowText: this.veryLowColor;
          case "2":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      case "EA":
        switch (level) {
          case "1":
          case "2":
            return this.veryLowText;
          case "3":
          case "4":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return this.expectedText
        }
      case "LC":
        switch (level) {
          case "1":
          case "2":
          case "3":
            return type == ClassificationType.TEXT ? this.veryLowText: this.veryLowColor;
          case "4":
            return type == ClassificationType.TEXT ? this.belowText : this.belowColor;
          default:
            return type == ClassificationType.TEXT ? this.expectedText: this.expectedColor;
        }
      default:
        break;
    }
  }
}
