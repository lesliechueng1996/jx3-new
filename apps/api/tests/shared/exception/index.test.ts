import { describe, expect, it } from 'bun:test';
import {
  AppException,
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  TooManyRequestsException,
  UnauthorizedException,
} from '@api/shared/exception';

describe('AppException', () => {
  it('stores status, code, and the subclass name', () => {
    const error = new AppException('boom', 500, 'CUSTOM');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('boom');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('CUSTOM');
    expect(error.name).toBe('AppException');
  });
});

describe('HTTP exception subclasses', () => {
  it('uses default messages and codes', () => {
    expect(new BadRequestException()).toMatchObject({
      statusCode: 400,
      code: ERROR_CODES.BAD_REQUEST,
      message: '请求参数错误',
      name: 'BadRequestException',
    });
    expect(new UnauthorizedException()).toMatchObject({
      statusCode: 401,
      code: ERROR_CODES.UNAUTHORIZED,
      message: '未授权',
    });
    expect(new ForbiddenException()).toMatchObject({
      statusCode: 403,
      code: ERROR_CODES.FORBIDDEN,
      message: '禁止访问',
    });
    expect(new NotFoundException()).toMatchObject({
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND,
      message: '资源不存在',
    });
    expect(new ConflictException()).toMatchObject({
      statusCode: 409,
      code: ERROR_CODES.CONFLICT,
      message: '资源冲突',
    });
    expect(new TooManyRequestsException()).toMatchObject({
      statusCode: 429,
      code: ERROR_CODES.TOO_MANY_REQUESTS,
      message: '请求过多',
    });
    expect(new InternalServerErrorException()).toMatchObject({
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: '服务器错误',
    });
  });

  it('accepts a custom message and code', () => {
    const error = new NotFoundException(
      '成语不存在',
      ERROR_CODES.IDIOM_NOT_FOUND,
    );

    expect(error.message).toBe('成语不存在');
    expect(error.code).toBe(ERROR_CODES.IDIOM_NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });
});
