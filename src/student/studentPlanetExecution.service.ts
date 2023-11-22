import { Injectable } from '@nestjs/common';
import { QuestionPlanentDto } from 'src/exam/dto/question-planet.dto';
import { AnswersPlanet } from './schemas/studentExam.schema';
import { EduException } from 'src/common/exceptions/edu-school.exception';
import { OptionAnswer } from 'src/exam/dto/request/answers-request.dto';

@Injectable()
export class StudentPlanetExecutionService {
  interceptCustomAnswer(
    answersPlanet: AnswersPlanet,
    questionAnswered: QuestionPlanentDto,
  ): AnswersPlanet {
    const modelHandlers = {
      MODEL11: this.interceptCustomAnswer_MODEL11,
      MODEL12: this.interceptCustomAnswer_MODEL12,
      MODEL27: this.interceptCustomAnswer_MODEL27,
      MODEL14: this.interceptCustomAnswer_MODEL14,
      MODEL35: this.interceptCustomAnswer_MODEL35,
    };

    const handler =
      modelHandlers[questionAnswered.model_id] || this.defaultHandler;
    return handler.call(this, answersPlanet, questionAnswered);
  }

  private interceptCustomAnswer_MODEL12(
    answersPlanet: AnswersPlanet,
  ): AnswersPlanet {
    answersPlanet.isCorrect = answersPlanet.optionsAnswered.every(
      (item) =>
        (item.isCorrect && item.positionAnswer == 2) ||
        (!item.isCorrect && item.positionAnswer == 1),
    );

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
    const questionHandlers = {
      MODEL11: this.handleQuestionAnswered_MODEL11,
      MODEL19: this.handleQuestionAnswered_MODEL19,
      MODEL14: this.handleQuestionAnswered_MODEL14,
      MODEL35: this.handleQuestionAnswered_MODEL35,
    };

    const handler =
      questionHandlers[questionAnswered.model_id] ||
      this.defaultQuestionHandler;
    return handler.call(this, questionAnswered);
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

  private defaultHandler(
    answersPlanet: AnswersPlanet,
    questionAnswered: QuestionPlanentDto,
  ): AnswersPlanet {
    return answersPlanet;
  }

  private defaultQuestionHandler(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    return questionAnswered;
  }

  async verifyAnswerPlanet(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): Promise<boolean> {
    switch (question.model_id) {
      case "MODEL12":
        return this.verifyAnswerPlanet_MODEL12(question, answerOptions);
      case "MODEL13":
        return this.verifyAnswerPlanet_MODEL13(question, answerOptions);    
      default:
        return await this.defaultVerifyAnswerPlanet(question, answerOptions);
    }
  }

  private async verifyAnswerPlanet_MODEL12(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): Promise<boolean> {
    const allAnswersAreCorrect = answerOptions.every((answeredOption) =>
      (answeredOption.positionAnswer == 2 && answeredOption.isCorrect) ||
      (answeredOption.positionAnswer == 1 && !answeredOption.isCorrect)
    );
    return allAnswersAreCorrect;
  }

  private async verifyAnswerPlanet_MODEL13(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): Promise<boolean> {
    const allAnswersAreCorrect = answerOptions.every((answeredOption) =>
      answeredOption.positionAnswer == answeredOption.position
    );
    return allAnswersAreCorrect;
  }

  private async defaultVerifyAnswerPlanet(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): Promise<boolean> {
    try {
      if (question.options.every((item) => item.isCorrect)) {
        return true;
      }

      let assertions = [];

      if (!question.orderedAnswer) {
        const correctOptions = question.options.filter(
          (option) => option.isCorrect,
        );

        if (correctOptions.length != answerOptions.length) {
          return false;
        }

        assertions = answerOptions.map((answeredOption) =>
          correctOptions.some(
            (option) =>
              option.sound_url === answeredOption.sound_url &&
              option.image_url === answeredOption.image_url &&
              option.position === answeredOption.position &&
              option.isCorrect === answeredOption.isCorrect,
          ),
        );
      } else {
        if (answerOptions.length == 0) {
          return false;
        }

        assertions = answerOptions.map((answeredOption) =>
          question.options.some(
            (option) =>
              answeredOption != undefined &&
              option.position === answeredOption.position &&
              answeredOption.position === answeredOption.positionAnswer,
          ),
        );
      }

      const allAnswersAreCorrect = assertions.every((assert) => assert);
      return allAnswersAreCorrect;
    } catch (error) {
      console.error('verifyAnswer: Error:', error);
      throw new EduException('DATABASE_ERROR');
    }
  }
}
