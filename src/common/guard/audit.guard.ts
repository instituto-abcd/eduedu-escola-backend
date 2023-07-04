import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../../common/constants';
import { Request } from 'express';
import { EduException } from '../../common/exceptions/edu-school.exception';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class _AuditGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new EduException('MISSING_TOKEN');
    }

    const user = await this.getUser(token);

    if (!user) {
      throw new EduException('USER_NOT_FOUND');
    }

    const methodDict = {
      POST: 'Criar',
      DELETE: 'Excluir',
    };

    console.log(request.method, methodDict[request.method]);

    if (!Object.keys(methodDict).includes(request.method)) {
      throw new HttpException('AUDIT__METHOD_NOT_ALLOWED', 405);
    }

    const entityDict = {
      '/school-year': 'Ano letivo',
      '/school-class': 'Turma',
      '/student': 'Aluno',
      '/user': 'Usuário',
    };

    console.log(request.url, entityDict[request.url]);

    if (!Object.keys(entityDict).includes(request.url)) {
      throw new HttpException('AUDIT__ENTITY_NOT_ALLOWED', 400);
    }

    await this.prismaService.audit.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        action: methodDict[request.method],
        entity: entityDict[request.url],
      },
    });

    return true;
  }

  private async getUser(token: string) {
    const _user = await this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });

    const user = await this.prismaService.user.findUnique({
      where: {
        email: _user.email,
      },
    });

    return user;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) {
      return undefined;
    }

    const [type, token] = authorizationHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}

export const AuditGuard = () => UseGuards(_AuditGuard);
