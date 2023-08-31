import { Injectable } from "@nestjs/common";
import { QuestionPlanentDto } from "src/exam/dto/question-planet.dto";

@Injectable()
export class StudentPlanetExecutionService {
  constructor() { }

  handleCustomQuestion(
    questionAnswered: QuestionPlanentDto
  ): QuestionPlanentDto {
    switch (questionAnswered.model_id) {
      case "MODEL14":
        return this.handleQuestionAnswered_MODEL14(questionAnswered);    
      default:
        return questionAnswered;
    }
  }

  private handleQuestionAnswered_MODEL14(
    questionAnswered: QuestionPlanentDto
  ): QuestionPlanentDto {
    let circleSize = questionAnswered.rules.length > 0 &&
      questionAnswered.rules.filter((item) => item.name == 'circle_size').length > 0 ?
      +questionAnswered.rules.find((item) => item.name == 'circle_size').value : 4;

    let correctValue = (questionAnswered.options[0].description as string).split('-').length;

    let options = [];
    for (let index = 0; index < circleSize; index++) {
      options.push({
        position: index,
        isCorrect: index + 1 == correctValue,
      })
    }

    questionAnswered.options = options;

    return questionAnswered;
  }

}