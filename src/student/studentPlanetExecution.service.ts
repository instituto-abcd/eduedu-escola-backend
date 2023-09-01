import { Injectable } from "@nestjs/common";
import { QuestionPlanentDto } from "src/exam/dto/question-planet.dto";

@Injectable()
export class StudentPlanetExecutionService {
  constructor() { }

  handleCustomQuestion(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    switch (questionAnswered.model_id) {
      case "MODEL19":
        return this.handleQuestionAnswered_MODEL19(questionAnswered);
      case "MODEL14":
        return this.handleQuestionAnswered_MODEL14(questionAnswered);    
      default:
        return questionAnswered;
    }
  }

  private handleQuestionAnswered_MODEL19(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    let targets = questionAnswered.titles
      .find((item) => item.type == 'TEXT' && item.description.includes(' ')).description.split(' ');

    questionAnswered.options.forEach((option) => {
      let rule = questionAnswered.rules.find((item) => item.name == 'verify').value;

      switch (rule) {
        case "starts_with":
          let initialChar = option.description.substring(0, 1);
          option.position = targets.indexOf(initialChar);
          break;
          
        case "ends_with":
          let finalChar = option.description.substring(option.description.length-1, 1);
          option.position = targets.indexOf(finalChar);
          break;

        case "contains":
          targets.forEach(target => {
            let charIsContained = option.description.includes(target);
            option.position = charIsContained ? targets.indexOf(target) : null;
          });

        default:
          break;
      }
    });

    questionAnswered.orderedAnswer = true;

    return questionAnswered;
  }

  private handleQuestionAnswered_MODEL14(
    questionAnswered: QuestionPlanentDto,
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