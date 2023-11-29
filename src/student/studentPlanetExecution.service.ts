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
      MODEL12: this.interceptCustomAnswer_MODEL12,
      MODEL14: this.interceptCustomAnswer_MODEL14,
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

  handleCustomQuestion(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    const questionHandlers = {
      MODEL14: this.handleQuestionAnswered_MODEL14,
      MODEL35: this.handleQuestionAnswered_MODEL35,
    };

    const handler =
      questionHandlers[questionAnswered.model_id] ||
      this.defaultQuestionHandler;
    return handler.call(this, questionAnswered);
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

  private handleQuestionAnswered_MODEL35(
    questionAnswered: QuestionPlanentDto,
  ): QuestionPlanentDto {
    questionAnswered.orderedAnswer = true;
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

  verifyAnswerPlanet(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): boolean {
    switch (question.model_id) {
      case "MODEL11":
        return this.verifyAnswerPlanet_MODEL11(question, answerOptions);
      case "MODEL12":
        return this.verifyAnswerPlanet_MODEL12(question, answerOptions);
      case "MODEL13":
        return this.verifyAnswerPlanet_MODEL13(question, answerOptions);
      case "MODEL19":
        return this.verifyAnswerPlanet_MODEL19(question, answerOptions);
      case "MODEL35":
        return this.verifyAnswerPlanet_MODEL35(question, answerOptions);
      case "MODEL2":
      case "MODEL18":
      case "MODEL20":
      case "MODEL25":
      case "MODEL26":
      case "MODEL29":
      case "MODEL31":
        return this.verifyAnswerPlanetByPositionAnswer(question, answerOptions);
      default:
        return this.defaultVerifyAnswerPlanet(question, answerOptions);
    }
  }

  private verifyAnswerPlanet_MODEL11(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): boolean {
    const expectedOptionAnswers = question.rules.find(
      (rule) => rule.name === 'answers',
    )?.value;

    const providedAnswer = answerOptions
      .map((option) => option.description)
      .join(',');

    return expectedOptionAnswers == providedAnswer;
  }

  private verifyAnswerPlanet_MODEL12(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): boolean {
    const allAnswersAreCorrect = answerOptions.every((answeredOption) =>
      (answeredOption.positionAnswer == 2 && answeredOption.isCorrect) ||
      (answeredOption.positionAnswer == 1 && !answeredOption.isCorrect)
    );
    return allAnswersAreCorrect;
  }

  private verifyAnswerPlanet_MODEL13(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): boolean {
    const allAnswersAreCorrect = answerOptions.every((answeredOption) =>
      (answeredOption.positionAnswer == (answeredOption.position ?? 1))
    );
    return allAnswersAreCorrect;
  }

  private verifyAnswerPlanet_MODEL19(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): boolean {
    const rule = question.rules.find(
      (item) => item.name == 'verify',
    ).value;
    
    const targets = question.titles
      .find((item) => item.type == 'TEXT' && item.description.includes(' '))
      .description.split(' ');

    const answers = answerOptions
      .map(answerOption => answerOption.description);
    let asserts = [];

    for (let index = 0; index < answers.length; index++) {
      const answer = answers[index];
      switch (rule) {
        case 'starts_with':
          asserts.push(targets[index].startsWith(answer));
          break;
        case 'ends_with':
          asserts.push(targets[index].endsWith(answer));
          break;
        case 'contains':
          asserts.push(targets[index].includes(answer));
          break;
      }
    }

    return asserts.every(assert => assert);
  }

  private verifyAnswerPlanet_MODEL35(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): boolean {
    const expectedAnswer = question.rules.find(
      (rule) => rule.name === 'answer',
    )?.value;

    const providedAnswer = answerOptions
      .map((option) => option.description)
      .join('')
      .toUpperCase();

    return expectedAnswer === providedAnswer;
  }

  private verifyAnswerPlanetByPositionAnswer(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): boolean {
    const allAnswersAreCorrect = answerOptions.every((answeredOption) =>
      (answeredOption.positionAnswer == answeredOption.position)
    );
    return allAnswersAreCorrect;
  }

  private defaultVerifyAnswerPlanet(
    question: QuestionPlanentDto,
    answerOptions: OptionAnswer[],
  ): boolean {
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
