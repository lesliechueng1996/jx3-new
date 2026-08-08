import { type TSchema, t } from 'elysia';
import { AppException, ERROR_CODES } from '@/shared/exception';

export class AppResponse<T> {
  data: T;
  message: string;
  code: string;

  constructor(data: T, message: string, code: string) {
    this.data = data;
    this.message = message;
    this.code = code;
  }

  static fromException(exception: Error): AppResponse<null> {
    if (exception instanceof AppException) {
      return new AppResponse(null, exception.message, exception.code);
    }

    return new AppResponse(null, '系统异常', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }

  static success<T>(data: T): AppResponse<T> {
    return new AppResponse(data, 'OK', ERROR_CODES.SUCCESS);
  }

  static error({
    code = ERROR_CODES.INTERNAL_SERVER_ERROR,
    message = '系统异常',
  }: {
    code?: string;
    message?: string;
  } = {}): AppResponse<null> {
    return new AppResponse(null, message, code);
  }

  toJson() {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

export const createSuccessResponseSchema = (data: TSchema) =>
  t.Object({
    code: t.Literal(ERROR_CODES.SUCCESS),
    message: t.String(),
    data,
  });

export const errorResponseSchema = t.Object({
  code: t.String(),
  message: t.String(),
  data: t.Null(),
});
