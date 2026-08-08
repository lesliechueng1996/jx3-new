import { Idiom } from '@/domain/idiom/idiom';
import { logger } from '@/infrastructure/logger';
import { IdiomRepository } from '@/infrastructure/repository/idiom-repository';
import type { CreateIdiomResponse } from '@/interface/schema/idiom-schema';
import { ConflictException, ERROR_CODES } from '@/shared/exception';
import { formatDateTime } from '@/shared/util/date';
import { isUniqueViolationError } from '@/shared/util/db';

export const createIdiom = async (
  text: string,
  meaning: string = '',
): Promise<CreateIdiomResponse> => {
  const idiom = new Idiom(text, meaning);
  const idiomRepository = new IdiomRepository();
  try {
    const result = await idiomRepository.create(idiom);

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
