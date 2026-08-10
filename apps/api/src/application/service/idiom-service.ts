import { Idiom } from '@api/domain/idiom/idiom';
import { logger } from '@api/infrastructure/logger';
import { IdiomCharRepository } from '@api/infrastructure/repository/idiom-char-repository';
import { IdiomPhraseRepository } from '@api/infrastructure/repository/idiom-phrase-repository';
import type {
  CreateIdiomResponse,
  GetIdiomResponse,
  ImportIdiomsResponse,
  ListIdiomsQuery,
  UpdateIdiomBody,
} from '@api/interface/schema/idiom-schema';
import {
  AppException,
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';
import { isUniqueViolationError } from '@api/shared/util/db';
import { pickDefinedProperties } from '@api/shared/util/object';
import { parseCsv, parseCsvHeaders } from '@api/shared/util/parse-csv';

const idiomPhraseRepository = new IdiomPhraseRepository();
const idiomCharRepository = new IdiomCharRepository();

export const createIdiom = async (
  text: string,
  meaning: string = '',
): Promise<CreateIdiomResponse> => {
  const existingIdiom = await idiomPhraseRepository.findByText(text);
  if (existingIdiom) {
    throw new ConflictException('成语已存在', ERROR_CODES.IDIOM_ALREADY_EXISTS);
  }

  const idiom = new Idiom(text, meaning);
  try {
    const result = await idiomPhraseRepository.create(idiom);

    return {
      id: result.idiom.id,
      text: result.idiom.text,
      charCount: result.idiom.charCount,
      pinyin: result.idiom.pinyin,
      tonePattern: result.idiom.tonePattern,
      meaning: result.idiom.meaning,
      chars: result.chars.map((char) => ({
        id: char.id,
        idiomId: char.idiomId,
        position: char.position,
        char: char.char,
        pinyin: char.pinyin,
        initial: char.initial,
        final: char.final,
        tone: char.tone,
        createdAt: formatDateTime(char.createdAt),
        updatedAt: formatDateTime(char.updatedAt),
      })),
      createdAt: formatDateTime(result.idiom.createdAt),
      updatedAt: formatDateTime(result.idiom.updatedAt),
    };
  } catch (error) {
    logger.error('Create idiom failed, {error}', { error });

    if (isUniqueViolationError(error, 'idiom_phrase_text_unique')) {
      throw new ConflictException(
        '成语已存在',
        ERROR_CODES.IDIOM_ALREADY_EXISTS,
      );
    }
    throw error;
  }
};

const findIdiomByIdOrThrow = async (id: string) => {
  const idiom = await idiomPhraseRepository.findById(id);
  if (!idiom) {
    throw new NotFoundException('成语不存在', ERROR_CODES.IDIOM_NOT_FOUND);
  }
  return idiom;
};

export const getIdiom = async (id: string): Promise<GetIdiomResponse> => {
  const idiom = await findIdiomByIdOrThrow(id);

  const chars = await idiomCharRepository.findByPhraseId(idiom.id);

  return {
    id: idiom.id,
    text: idiom.text,
    charCount: idiom.charCount,
    pinyin: idiom.pinyin,
    tonePattern: idiom.tonePattern,
    meaning: idiom.meaning,
    chars: chars.map((char) => ({
      id: char.id,
      idiomId: char.idiomId,
      position: char.position,
      char: char.char,
      pinyin: char.pinyin,
      initial: char.initial,
      final: char.final,
      tone: char.tone,
      createdAt: formatDateTime(char.createdAt),
      updatedAt: formatDateTime(char.updatedAt),
    })),
    createdAt: formatDateTime(idiom.createdAt),
    updatedAt: formatDateTime(idiom.updatedAt),
  };
};

export const deleteIdiom = async (id: string): Promise<void> => {
  await idiomPhraseRepository.deleteById(id);
};

export const listIdiomsPagination = async (query: ListIdiomsQuery) => {
  const { text, page, pageSize } = query;
  const offset = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    idiomPhraseRepository.listPagination(text ?? '', pageSize, offset),
    idiomPhraseRepository.count(text ?? ''),
  ]);

  return {
    items: rows.map((item) => ({
      id: item.id,
      text: item.text,
      charCount: item.charCount,
      pinyin: item.pinyin,
      tonePattern: item.tonePattern,
      meaning: item.meaning,
      createdAt: formatDateTime(item.createdAt),
      updatedAt: formatDateTime(item.updatedAt),
    })),
    total,
    page,
    pageSize,
  };
};

export const updateIdiom = async (id: string, body: UpdateIdiomBody) => {
  await findIdiomByIdOrThrow(id);

  const chars = body.chars;
  const textLength =
    body.text !== undefined ? Array.from(body.text).length : undefined;

  if (chars && textLength !== undefined && chars.length !== textLength) {
    throw new BadRequestException('成语文本长度与字列表数量不一致');
  }

  const pickedProperties = pickDefinedProperties(body, ['chars']);
  const updatedIdiomProperties = {
    ...pickedProperties,
    ...(chars
      ? {
          tonePattern: chars.map((char) => char.tone).join('-'),
          charCount: chars.length,
        }
      : textLength !== undefined
        ? { charCount: textLength }
        : {}),
  };

  try {
    const result = await idiomPhraseRepository.updateById(
      id,
      updatedIdiomProperties,
      chars ?? [],
    );

    if (!result) {
      throw new NotFoundException('成语不存在', ERROR_CODES.IDIOM_NOT_FOUND);
    }

    return {
      id: result.idiom.id,
      text: result.idiom.text,
      charCount: result.idiom.charCount,
      pinyin: result.idiom.pinyin,
      tonePattern: result.idiom.tonePattern,
      meaning: result.idiom.meaning,
      chars: result.chars.map((char) => ({
        id: char.id,
        idiomId: char.idiomId,
        position: char.position,
        char: char.char,
        pinyin: char.pinyin,
        initial: char.initial,
        final: char.final,
        tone: char.tone,
        createdAt: formatDateTime(char.createdAt),
        updatedAt: formatDateTime(char.updatedAt),
      })),
      createdAt: formatDateTime(result.idiom.createdAt),
      updatedAt: formatDateTime(result.idiom.updatedAt),
    };
  } catch (error) {
    if (isUniqueViolationError(error, 'idiom_phrase_text_unique')) {
      throw new ConflictException(
        '成语已存在',
        ERROR_CODES.IDIOM_ALREADY_EXISTS,
      );
    }
    throw error;
  }
};

export const importIdiomsFromCsvFile = async (file: File) => {
  const content = await file.text();
  const headers = parseCsvHeaders(content);

  if (headers.length === 0) {
    throw new BadRequestException(
      'CSV文件为空或缺少表头',
      ERROR_CODES.IDIOM_CSV_EMPTY_OR_MISSING_HEADERS,
    );
  }

  if (!headers.includes('text')) {
    throw new BadRequestException(
      'CSV文件缺少text列',
      ERROR_CODES.IDIOM_CSV_MISSING_TEXT_COLUMN,
    );
  }

  const rows = parseCsv(content);

  if (rows.length === 0) {
    throw new BadRequestException('CSV文件为空', ERROR_CODES.IDIOM_CSV_EMPTY);
  }

  const result: ImportIdiomsResponse = {
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const text = row.text?.trim();
    const pinyinValue = row.pinyin?.trim();
    const meaning = row.meaning?.trim() ? row.meaning.trim() : null;

    if (!text) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        text,
        message: 'text 不能为空',
      });
      continue;
    }

    try {
      const processed = new Idiom(text, meaning ?? '', pinyinValue ?? '');
      await idiomPhraseRepository.insertProcessedIdiom(processed);
      result.created += 1;
    } catch (error) {
      if (isUniqueViolationError(error, 'idiom_phrase_text_unique')) {
        result.skipped += 1;
        continue;
      }

      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        text,
        message: error instanceof AppException ? error.message : '导入失败',
      });
    }
  }

  return result;
};

export const getPinyin = async (text: string) => {
  const dbIdiom = await idiomPhraseRepository.findByText(text);
  if (dbIdiom) {
    const chars = await idiomCharRepository.findByPhraseId(dbIdiom.id);

    if (chars.length !== text.length || chars.length !== dbIdiom.charCount) {
      throw new BadRequestException(
        '数据库中成语数据错误，请联系管理员',
        ERROR_CODES.IDION_DB_BROKEN_DATA,
      );
    }

    return {
      text: dbIdiom.text,
      inDatabase: true,
      idiomId: dbIdiom.id,
      cells: chars.map((char) => ({
        position: char.position,
        char: char.char,
        pinyin: char.pinyin,
        initial: char.initial,
        final: char.final,
        tone: char.tone,
      })),
    };
  }

  const idiom = new Idiom(text, '', '');

  return {
    text: idiom.text,
    inDatabase: false,
    idiomId: null,
    cells: idiom.chars.map((char) => ({
      position: char.position,
      char: char.char,
      pinyin: char.pinyin,
      initial: char.initial,
      final: char.final,
      tone: char.tone,
    })),
  };
};
