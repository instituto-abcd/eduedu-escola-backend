import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../../common/constants';
import { Request } from 'express';
import { EduException } from '../../common/exceptions/edu-school.exception';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserGuard implements CanActivate {
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

    const _user = await this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });

    const user = await this.prismaService.user.findUnique({
      where: {
        email: _user.email,
      },
    });

    request['user'] = user;
    return true;
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
