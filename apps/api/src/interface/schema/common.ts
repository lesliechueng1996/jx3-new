import { AppException, ERROR_CODES } from '@api/shared/exception';
import { type TSchema, t } from 'elysia';

export class AppResponse<T, C extends string = string> {
  data: T;
  message: string;
  code: C;

  constructor(data: T, message: string, code: C) {
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

  static success(): AppResponse<null, typeof ERROR_CODES.SUCCESS>;
  static success<T>(data: T): AppResponse<T, typeof ERROR_CODES.SUCCESS>;
  static success<T>(
    data?: T,
  ): AppResponse<T | null, typeof ERROR_CODES.SUCCESS> {
    return new AppResponse(
      data ?? null,
      'OK',
      ERROR_CODES.SUCCESS,
    ) as AppResponse<T | null, typeof ERROR_CODES.SUCCESS>;
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

  toJson(): { code: C; message: string; data: T } {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

export const createSuccessResponseSchema = <T extends TSchema>(data: T) =>
  t.Object({
    code: t.Literal(ERROR_CODES.SUCCESS),
    message: t.String(),
    data,
  });

export const emptySuccessResponseSchema = createSuccessResponseSchema(t.Null());

export const errorResponseSchema = t.Object({
  code: t.String(),
  message: t.String(),
  data: t.Null(),
});

export const paginationQuerySchema = t.Object({
  page: t.Integer({
    minimum: 1,
    default: 1,
  }),
  pageSize: t.Integer({
    minimum: 1,
    maximum: 100,
    default: 20,
  }),
});

export const paginationResponseSchema = t.Object({
  total: t.Integer(),
  page: t.Integer(),
  pageSize: t.Integer(),
});
