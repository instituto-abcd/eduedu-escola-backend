import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SchoolId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.schoolId || '';
  },
);
