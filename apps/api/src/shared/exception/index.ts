import { ERROR_CODES } from './error-code';

export { ERROR_CODES };

export class AppException extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = new.target.name;
  }
}

export class BadRequestException extends AppException {
  constructor(
    message: string = '请求参数错误',
    code: string = ERROR_CODES.BAD_REQUEST,
  ) {
    super(message, 400, code);
  }
}

export class UnauthorizedException extends AppException {
  constructor(
    message: string = '未授权',
    code: string = ERROR_CODES.UNAUTHORIZED,
  ) {
    super(message, 401, code);
  }
}

export class ForbiddenException extends AppException {
  constructor(
    message: string = '禁止访问',
    code: string = ERROR_CODES.FORBIDDEN,
  ) {
    super(message, 403, code);
  }
}

export class NotFoundException extends AppException {
  constructor(
    message: string = '资源不存在',
    code: string = ERROR_CODES.NOT_FOUND,
  ) {
    super(message, 404, code);
  }
}

export class TooManyRequestsException extends AppException {
  constructor(
    message: string = '请求过多',
    code: string = ERROR_CODES.TOO_MANY_REQUESTS,
  ) {
    super(message, 429, code);
  }
}

export class InternalServerErrorException extends AppException {
  constructor(
    message: string = '服务器错误',
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
  ) {
    super(message, 500, code);
  }
}
