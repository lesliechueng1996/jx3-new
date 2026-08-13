import { logger } from '@api/infrastructure/logger';
import { IdiomCharRepository } from '@api/infrastructure/repository/idiom-char-repository';
import { IdiomPhraseRepository } from '@api/infrastructure/repository/idiom-phrase-repository';
import type {
  SearchAnalysis,
  SearchIdiomsResponse,
} from '@api/interface/schema/idiom-schema';
import { BadRequestException } from '@api/shared/exception';
import { and, eq, exists, ne, notExists, type SQL } from '@api/shared/util/db';
import { db, idiomChar, idiomPhrase } from '@jx3/db';
import { Idiom } from './idiom';
import { IdiomChar } from './idiom-char';
import type {
  GreenLock,
  PhoneticField,
  SqlNecessaryCondition,
} from './idiom-game-cell';
import {
  IdiomGameRound,
  type IdiomGameRoundConstructorParams,
} from './idiom-game-round';

export type IdiomGameConstructorParams = {
  rounds: IdiomGameRoundConstructorParams[];
  limit: number;
};

const PROBE_CANDIDATE_LIMIT = 30;
const POSITION_LABELS = ['第 1 字', '第 2 字', '第 3 字', '第 4 字'] as const;

export class IdiomGame {
  private readonly rounds: IdiomGameRound[];
  private readonly limit: number;
  private readonly idiomPhraseRepository: IdiomPhraseRepository;
  private readonly idiomCharRepository: IdiomCharRepository;

  constructor(props: IdiomGameConstructorParams) {
    this.rounds = props.rounds.map(
      (roundProps) => new IdiomGameRound(roundProps),
    );
    this.limit = props.limit;
    this.idiomPhraseRepository = new IdiomPhraseRepository();
    this.idiomCharRepository = new IdiomCharRepository();
  }

  async search(): Promise<SearchIdiomsResponse> {
    if (this.rounds.length === 0) {
      throw new BadRequestException('回合数不能为空');
    }

    if (this.limit <= 0) {
      throw new BadRequestException('回合限制数量不能小于等于0');
    }

    if (this.rounds.length > this.limit) {
      throw new BadRequestException('已超出最大回合限制');
    }

    const greenLocks = this.#collectGreenLocks();
    if (greenLocks === null) {
      return {
        total: 0,
        items: [],
        analysis: this.#emptyAnalysis('约束互相矛盾，请检查绿色标注是否冲突'),
      };
    }

    const possibleIdioms = await this.#loadIdioms();
    logger.info(`Loaded ${possibleIdioms.length} possible idioms`);

    const afterGreenLocksFilteredIdioms = this.#filterPossibleByGreenLocks(
      possibleIdioms,
      greenLocks,
    );
    logger.info(
      `After green locks filtered, ${afterGreenLocksFilteredIdioms.length} idioms left`,
    );

    const matched = this.#filterPossibleByMatchAllRounds(
      afterGreenLocksFilteredIdioms,
    );
    logger.info(
      `After match all rounds filtered, ${matched.length} idioms left`,
    );

    const total = matched.length;
    if (total === 0) {
      return {
        total: 0,
        items: [],
        analysis: this.#emptyAnalysis(
          '未找到匹配的成语，请检查标注是否与截图一致，或词库中缺少目标成语',
        ),
      };
    }

    const byPosition = this.#buildPositionAnalysis(matched);
    const isUnique = matched.length === 1;
    if (total > PROBE_CANDIDATE_LIMIT) {
      return {
        total,
        items: this.#toSearchItems(matched),
        analysis: {
          isUnique,
          byPosition,
          suggestedProbes: [],
          message: '候选过多，请补充更多绿色或橙色约束后再检索',
        },
      };
    }

    return {
      total,
      items: this.#toSearchItems(matched),
      analysis: {
        isUnique,
        byPosition,
        suggestedProbes: this.#buildProbeSuggestions(matched),
        message: isUnique ? '找到唯一匹配' : undefined,
      },
    };
  }

  #filterPossibleByGreenLocks(
    possibleIdioms: Idiom[],
    greenLocks: GreenLock[],
  ): Idiom[] {
    return possibleIdioms.filter((possiableIdiom) => {
      return greenLocks.every((greenLock) => {
        const char = possiableIdiom.chars[greenLock.position];
        if (!char) {
          return false;
        }

        switch (greenLock.kind) {
          case 'char':
            return char.char === greenLock.value;
          case 'initial':
            return char.initial === greenLock.value;
          case 'final':
            return char.final === greenLock.value;
          case 'tone':
            return char.tone === greenLock.value;
          default:
            return false;
        }
      });
    });
  }

  #filterPossibleByMatchAllRounds(possibleIdioms: Idiom[]): Idiom[] {
    return possibleIdioms.filter((possiableIdiom) => {
      return this.rounds.every((round) => {
        return round.validateFeedback(possiableIdiom);
      });
    });
  }

  #collectGreenLocks(): GreenLock[] | null {
    const greenLocks = this.rounds.flatMap((round) =>
      round.collectGreenLocks(),
    );

    for (let i = 0; i < greenLocks.length; i++) {
      for (let j = i + 1; j < greenLocks.length; j++) {
        const greenLock1 = greenLocks[i];
        const greenLock2 = greenLocks[j];
        if (!greenLock1 || !greenLock2) {
          continue;
        }

        if (
          greenLock1.kind === greenLock2.kind &&
          greenLock1.position === greenLock2.position &&
          greenLock1.value !== greenLock2.value
        ) {
          return null;
        }
      }
    }

    return greenLocks;
  }

  #conditionKey(condition: SqlNecessaryCondition): string {
    switch (condition.kind) {
      case 'green':
        return `green:${condition.field}:${condition.position}:${condition.value}`;
      case 'black':
        return `black:${condition.field}:${condition.value}`;
      case 'orange':
        return `orange:${condition.field}:${condition.position}:${condition.value}`;
      default:
        logger.error('Unknown condition kind');
        return '';
    }
  }

  #fieldColumn(field: PhoneticField) {
    switch (field) {
      case 'char':
        return idiomChar.char;
      case 'initial':
        return idiomChar.initial;
      case 'final':
        return idiomChar.final;
      case 'tone':
        return idiomChar.tone;
      default: {
        logger.error('Unknown field');
        return null;
      }
    }
  }

  #conditionToSql(condition: SqlNecessaryCondition): SQL | null {
    const fieldColumn = this.#fieldColumn(condition.field);
    if (fieldColumn === null) {
      return null;
    }

    switch (condition.kind) {
      case 'green':
        return exists(
          db
            .select({ id: idiomChar.id })
            .from(idiomChar)
            .where(
              and(
                eq(idiomChar.idiomId, idiomPhrase.id),
                eq(idiomChar.position, condition.position),
                eq(fieldColumn, condition.value),
              ),
            ),
        );
      case 'black':
        return notExists(
          db
            .select({ id: idiomChar.id })
            .from(idiomChar)
            .where(
              and(
                eq(idiomChar.idiomId, idiomPhrase.id),
                eq(fieldColumn, condition.value),
              ),
            ),
        );
      case 'orange':
        return exists(
          db
            .select({ id: idiomChar.id })
            .from(idiomChar)
            .where(
              and(
                eq(idiomChar.idiomId, idiomPhrase.id),
                eq(fieldColumn, condition.value),
                ne(idiomChar.position, condition.position),
              ),
            ),
        );
      default: {
        logger.error('Unknown condition kind');
        return null;
      }
    }
  }

  #buildPrefilterWhere(conditions: SqlNecessaryCondition[]): SQL | undefined {
    const clauses: SQL[] = [eq(idiomPhrase.charCount, 4)];
    for (const condition of conditions) {
      const conditionSql = this.#conditionToSql(condition);
      if (conditionSql === null) {
        continue;
      }

      clauses.push(conditionSql);
    }
    return and(...clauses);
  }

  #extractSqlNecessaryConditions(): SqlNecessaryCondition[] {
    const conditions: SqlNecessaryCondition[] = [];
    const conditionKeySet: Set<string> = new Set();

    for (const round of this.rounds) {
      const roundConditions = round.extractSqlNecessaryConditions();
      for (const condition of roundConditions) {
        const conditionKey = this.#conditionKey(condition);
        if (conditionKeySet.has(conditionKey)) {
          continue;
        }

        conditionKeySet.add(conditionKey);
        conditions.push(condition);
      }
    }

    return conditions;
  }

  async #loadIdioms() {
    const sqlNecessaryConditions = this.#extractSqlNecessaryConditions();
    const prefilterWhere = this.#buildPrefilterWhere(sqlNecessaryConditions);
    const idioms = await this.idiomPhraseRepository.search(prefilterWhere);
    logger.info(`Loaded ${idioms.length} idioms by prefilter`);

    const idiomIds = idioms.map((idiom) => idiom.id);
    const chars = await this.idiomCharRepository.findByPhraseIds(idiomIds);
    logger.info(`Loaded ${chars.length} chars by idiom ids`);

    const idiomCharsMap = new Map<string, IdiomChar[]>();
    for (const char of chars) {
      const idiomChars = idiomCharsMap.get(char.idiomId) || [];
      idiomChars.push(new IdiomChar(char));
      idiomCharsMap.set(
        char.idiomId,
        idiomChars.sort((a, b) => a.position - b.position),
      );
    }

    const finalizedIdioms: Idiom[] = [];
    for (const idiom of idioms) {
      const idiomChars = idiomCharsMap.get(idiom.id) || [];
      if (idiomChars.length !== 4) {
        continue;
      }
      finalizedIdioms.push(
        new Idiom({
          id: idiom.id,
          text: idiom.text,
          meaning: idiom.meaning || '',
          pinyin: idiom.pinyin,
          tonePattern: idiom.tonePattern,
          chars: idiomChars,
        }),
      );
    }

    return finalizedIdioms;
  }

  #toSearchItems(matched: Idiom[]): SearchIdiomsResponse['items'] {
    return matched
      .filter((item): item is Idiom & { id: string } => item.id !== null)
      .slice(0, this.limit)
      .map((item) => ({
        id: item.id,
        text: item.text,
        pinyin: item.pinyin,
        meaning: item.meaning || null,
      }));
  }

  #emptyAnalysis(message: string): SearchAnalysis {
    return {
      isUnique: false,
      byPosition: [0, 1, 2, 3].map((position) => ({
        position,
        charOptions: [],
        initialOptions: [],
        finalOptions: [],
        toneOptions: [],
      })),
      suggestedProbes: [],
      message,
    };
  }

  #buildPositionAnalysis(candidates: Idiom[]) {
    return [0, 1, 2, 3].map((position) => ({
      position,
      charOptions: [
        ...new Set(
          candidates
            .map((item) => item.chars[position].char)
            .filter((value): value is string => Boolean(value)),
        ),
      ],
      initialOptions: [
        ...new Set(
          candidates
            .map((item) => item.chars[position].initial)
            .filter((value): value is string => Boolean(value)),
        ),
      ],
      finalOptions: [
        ...new Set(
          candidates
            .map((item) => item.chars[position].final)
            .filter((value): value is string => Boolean(value)),
        ),
      ],
      toneOptions: [
        ...new Set(
          candidates
            .map((item) => item.chars[position].tone)
            .filter((value): value is number => value !== undefined),
        ),
      ],
    }));
  }

  #buildReasonForPosition(candidates: Idiom[], position: number): string {
    const charOptions = [
      ...new Set(
        candidates
          .map((item) => item.chars[position].char)
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    const label = POSITION_LABELS[position] ?? `第 ${position + 1} 字`;

    if (charOptions.length <= 1) {
      return `${label}读音维度仍可区分`;
    }

    return `${label}仍有 ${charOptions.length} 种可能 (${charOptions.join('、')})`;
  }

  #buildProbeSuggestions(candidates: Idiom[], max = 5) {
    if (candidates.length <= 1) {
      return [];
    }

    const seen = new Set<string>();
    const scored = candidates
      .map((candidate) => {
        const { score, reasonPosition } = candidate.scoreCandidate(candidates);
        return {
          candidate,
          score,
          reason: this.#buildReasonForPosition(candidates, reasonPosition),
        };
      })
      .filter((item) => {
        if (seen.has(item.candidate.text)) {
          return false;
        }
        seen.add(item.candidate.text);
        return true;
      })
      .sort(
        (a, b) =>
          b.score - a.score || a.candidate.text.localeCompare(b.candidate.text),
      );

    return scored.slice(0, max).map((item) => ({
      text: item.candidate.text,
      reason: item.reason,
    }));
  }
}
