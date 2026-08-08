import { Idiom } from '@/domain/idiom/idiom';
import { logger } from '@/infrastructure/logger';
import { IdiomCharRepository } from '@/infrastructure/repository/idiom-char-repository';
import { IdiomPhraseRepository } from '@/infrastructure/repository/idiom-phrase-repository';
import type {
  CreateIdiomResponse,
  GetIdiomResponse,
  ListIdiomsQuery,
} from '@/interface/schema/idiom-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@/shared/exception';
import { formatDateTime } from '@/shared/util/date';
import { isUniqueViolationError } from '@/shared/util/db';

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

export const getIdiom = async (id: string): Promise<GetIdiomResponse> => {
  const idiom = await idiomPhraseRepository.findById(id);
  if (!idiom) {
    throw new NotFoundException('成语不存在', ERROR_CODES.IDIOM_NOT_FOUND);
  }

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
