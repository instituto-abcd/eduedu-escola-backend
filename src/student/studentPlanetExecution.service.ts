import { Injectable } from '@nestjs/common';
import { QuestionPlanentDto } from 'src/exam/dto/question-planet.dto';
import { AnswersPlanet } from './schemas/studentExam.schema';

@Injectable()
export class StudentPlanetExecutionService {
  interceptCustomAnswer(
    answersPlanet: AnswersPlanet,
    questionAnswered: QuestionPlanentDto,
  ): AnswersPlanet {
    switch (questionAnswered.model_id) {
      case 'MODEL11':
        return this.interceptCustomAnswer_MODEL11(
          answersPlanet,
          questionAnswered,
        );
      case 'MODEL12':
        return this.interceptCustomAnswer_MODEL12(
          answersPlanet,
          questionAnswered,
        );
      case 'MODEL27':
        return this.interceptCustomAnswer_MODEL27(
          answersPlanet,
          questionAnswered,
        );
      case 'MODEL14':
        return this.interceptCustomAnswer_MODEL14(
          answersPlanet,
          questionAnswered,
        );
      case 'MODEL35':
        return this.interceptCustomAnswer_MODEL35(
          answersPlanet,
          questionAnswered,
        );
      default:
        return answersPlanet;
    }
  }

  private interceptCustomAnswer_MODEL12(
    answersPlanet: AnswersPlanet,
    questionAnswered: QuestionPlanentDto,
  ): AnswersPlanet {
    const filteredOptions = answersPlanet.optionsAnswered.filter(
      (option) => option.isCorrect === true,
    );

    answersPlanet.optionsAnswered = filteredOptions;

    return answersPlanet;
  }

  private interceptCustomAnswer_MODEL11(
    answersPlanet: AnswersPlanet,
    questionAnswered: QuestionPlanentDto,
  ): AnswersPlanet {
    const expectedAnswer = questionAnswered.rules.find(
      (rule) => rule.name === 'answers',
    )?.value;

    const providedAnswer = answersPlanet.optionsAnswered
      .map((option) => option.description)
      .join(',');

    answersPlanet.isCorrect =
      expectedAnswer?.toUpperCase() === providedAnswer.toUpperCase();

    return answersPlanet;
  }

  private interceptCustomAnswer_MODEL14(
    answersPlanet: AnswersPlanet,
    questionAnswered: QuestionPlanentDto,
  ): AnswersPlanet {
    const hasAnswer = answersPlanet.optionsAnswered.length > 0;

    const positionAnswer = hasAnswer
      ? answersPlanet.optionsAnswered[0].positionAnswer
      : 0;
    answersPlanet.optionsAnswered = hasAnswer
      ? questionAnswered.options.filter(
          (item) => item.position == positionAnswer,
        )
      : [];

    return answersPlanet;
  }

  private interceptCustomAnswer_MODEL27(
    answersPlanet: AnswersPlanet,
    questionAnswered: QuestionPlanentDto,
  ): AnswersPlanet {
    answersPlanet.optionsAnswered = questionAnswered.options;
    return answersPlanet;
  }

  private interceptCustomAnswer_MODEL35(
    answersPlanet: AnswersPlanet,
    questionAnswered: QuestionPlanentDto,
  ): AnswersPlanet {
    const expectedAnswer = questionAnswered.rules.find(
      (rule) => rule.name === 'answer',
    )?.value;

    const providedAnswer = answersPlanet.optionsAnswered
      .map((option) => option.description)
      .join('')
      .toUpperCase();

    answersPlanet.isCorrect = expectedAnswer === providedAnswer;

    return answersPlanet;
  }

  handleCustomQuestion(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    switch (questionAnswered.model_id) {
      case 'MODEL11':
        return this.handleQuestionAnswered_MODEL11(questionAnswered);
      case 'MODEL19':
        return this.handleQuestionAnswered_MODEL19(questionAnswered);
      case 'MODEL14':
        return this.handleQuestionAnswered_MODEL14(questionAnswered);
      case 'MODEL35':
        return this.handleQuestionAnswered_MODEL35(questionAnswered);
      default:
        return questionAnswered;
    }
  }

  private handleQuestionAnswered_MODEL11(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    const expectedAnswer = questionAnswered.rules.find(
      (rule) => rule.name === 'answer',
    )?.value;

    const providedAnswer = questionAnswered.options
      .map((option) => option.description)
      .join(',');

    questionAnswered.orderedAnswer =
      expectedAnswer?.toUpperCase() === providedAnswer.toUpperCase();

    return questionAnswered;
  }

  private handleQuestionAnswered_MODEL14(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    const circleSize =
      questionAnswered.rules.length > 0 &&
      questionAnswered.rules.filter((item) => item.name == 'circle_size')
        .length > 0
        ? +questionAnswered.rules.find((item) => item.name == 'circle_size')
            .value
        : 4;

    const correctValue = (
      questionAnswered.options[0].description as string
    ).split('-').length;

    const options = [];
    for (let index = 0; index < circleSize; index++) {
      options.push({
        position: index,
        isCorrect: index + 1 == correctValue,
      });
    }

    questionAnswered.options = options;
    questionAnswered.orderedAnswer = questionAnswered.options.every(
      (item) => item.isCorrect,
    );

    return questionAnswered;
  }

  private handleQuestionAnswered_MODEL19(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    const targets = questionAnswered.titles
      .find((item) => item.type == 'TEXT' && item.description.includes(' '))
      .description.split(' ');

    questionAnswered.options.forEach((option) => {
      const rule = questionAnswered.rules.find(
        (item) => item.name == 'verify',
      ).value;

      switch (rule) {
        case 'starts_with':
          const initialChar = option.description.substring(0, 1);
          option.position = targets.indexOf(initialChar);
          break;

        case 'ends_with':
          const finalChar = option.description.substring(
            option.description.length - 1,
            1,
          );
          option.position = targets.indexOf(finalChar);
          break;

        case 'contains':
          targets.forEach((target) => {
            const charIsContained = option.description.includes(target);
            option.position = charIsContained ? targets.indexOf(target) : null;
          });

        default:
          break;
      }
    });

    questionAnswered.orderedAnswer = true;

    return questionAnswered;
  }

  private handleQuestionAnswered_MODEL35(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    const expectedAnswer = questionAnswered.rules.find(
      (rule) => rule.name === 'answer',
    )?.value;

    const providedAnswer = questionAnswered.options
      .map((option) => option.description)
      .join('')
      .toUpperCase();

    questionAnswered.orderedAnswer = expectedAnswer === providedAnswer;

    return questionAnswered;
  }
}
