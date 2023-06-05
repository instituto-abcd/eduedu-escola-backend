import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export const ErrorDetails = {
  EMAIL_CONFLICT: {
    message: 'E-mail já cadastrado.',
    status: HttpStatus.CONFLICT,
  },
  PERSONAL_DOCUMENT_CONFLICT: {
    message: 'Documento pessoal já cadastrado.',
    status: HttpStatus.CONFLICT,
  },
  INVALID_PAGINATION_PARAMETERS: {
    message: 'Número da página ou tamanho por página inválido.',
    status: HttpStatus.BAD_REQUEST,
  },
  DATABASE_ERROR: {
    message: 'Erro no banco de dados.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  USER_NOT_FOUND: {
    message: 'Usuário não encontrado.',
    status: HttpStatus.NOT_FOUND,
  },
  USERS_NOT_FOUND: {
    message: 'Nenhum usuário encontrado.',
    status: HttpStatus.NOT_FOUND,
  },
  CANNOT_CREATE_SCHOOL_YEAR: {
    message: 'Não é possível criar o ano letivo.',
    status: HttpStatus.FORBIDDEN,
  },
  SCHOOL_YEAR_ALREADY_ACTIVE: {
    message: 'Não é possível ativar um ano letivo diferente do ano atual',
    status: HttpStatus.CONFLICT,
  },
  SCHOOL_YEAR_NOT_FOUND: {
    message: 'Ano letivo não encontrado.',
    status: HttpStatus.NOT_FOUND,
  },
  SCHOOL_NOT_FOUND: {
    message: 'Escola não encontrada.',
    status: HttpStatus.NOT_FOUND,
  },
  UNKNOWN_ERROR: {
    message: 'Erro desconhecido ocorreu.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  ERROR_DELETING: {
    message: 'Erro ao excluir',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  MISSING_REQUIRED_FIELDS: {
    message: 'Campos obrigatórios não foram fornecidos.',
    status: HttpStatus.BAD_REQUEST,
  },

  INVALID_EMAIL: {
    message: 'E-mail inválido.',
    status: HttpStatus.BAD_REQUEST,
  },

  INVALID_DOCUMENT: {
    message: 'Documento inválido.',
    status: HttpStatus.BAD_REQUEST,
  },

  INVALID_PROFILE: {
    message: 'Perfil inválido.',
    status: HttpStatus.BAD_REQUEST,
  },

  INVALID_PASSWORD: {
    message: 'Senha inválida.',
    status: HttpStatus.BAD_REQUEST,
  },
  SCHOOL_YEAR_IS_ALREADY_ACTIVE: {
    message: 'O ano letivo já está ativo.',
    status: HttpStatus.BAD_REQUEST,
  },
  SCHOOL_YEAR_IS_INACTIVE: {
    message: 'Você não pode ativar um ano letivo finalizado.',
    status: HttpStatus.BAD_REQUEST,
  },
  SCHOOL_YEAR_ALREADY_EXISTS: {
    message: 'O ano letivo atual já existe como rascunho.',
    status: HttpStatus.CONFLICT,
  },
  NEXT_SCHOOL_YEAR_ALREADY_EXISTS: {
    message: 'O próximo ano letivo já existe.',
    status: HttpStatus.CONFLICT,
  },
  SCHOOL_YEAR_CANNOT_BE_ACTIVATED: {
    message: 'O ano letivo não pode ser ativado.',
    status: HttpStatus.CONFLICT,
  },
  NO_SCHOOL_YEAR_TO_DELETE: {
    message: 'Você não possui um ano letivo disponível para exclusão.',
    status: HttpStatus.NOT_FOUND,
  },
};

export class EduException extends HttpException {
  @ApiProperty({ enum: Object.keys(ErrorDetails) })
  readonly code: keyof typeof ErrorDetails;

  @ApiProperty()
  readonly message: string;

  constructor(errorCode: keyof typeof ErrorDetails) {
    super(
      {
        code: errorCode,
        message: ErrorDetails[errorCode].message,
      },
      ErrorDetails[errorCode].status,
    );
    this.code = errorCode;
    this.message = ErrorDetails[errorCode].message;
  }
}
