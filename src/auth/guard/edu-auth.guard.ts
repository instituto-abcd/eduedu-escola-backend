import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../../common/constants';
import { Request } from 'express';
import { EduException } from '../../common/exceptions/edu-school.exception';

@Injectable()
export class EduAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private allowedProfile: string,
    private isGeneric: boolean,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new EduException('MISSING_TOKEN');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
    } catch {
      throw new EduException('INVALID_TOKEN');
    }

    if (this.isGeneric == false) {
      const { profile } = payload;
      if (!profile || profile !== this.allowedProfile) {
        throw new EduException('INVALID_PROFILE');
      }
    }

    request['user'] = payload;
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
