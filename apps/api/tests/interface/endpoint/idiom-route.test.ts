import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const timestamp = '2026-01-01 00:00:00';

const idiomPayload = {
  id: 'i1',
  text: '一帆风顺',
  charCount: 4,
  pinyin: 'yi1 fan2 feng1 shun4',
  tonePattern: '1-2-1-4',
  meaning: 'smooth',
  chars: ['一', '帆', '风', '顺'].map((char, position) => ({
    id: `c${position}`,
    idiomId: 'i1',
    position,
    char,
    pinyin: 'x1',
    initial: 'x',
    final: 'i',
    tone: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  })),
  createdAt: timestamp,
  updatedAt: timestamp,
};

const createIdiom = mock(async () => idiomPayload);
const getIdiom = mock(async () => idiomPayload);
const deleteIdiom = mock(async () => undefined);
const listIdiomsPagination = mock(async () => ({
  items: [
    {
      id: 'i1',
      text: '一帆风顺',
      charCount: 4,
      pinyin: 'yi1 fan2 feng1 shun4',
      tonePattern: '1-2-1-4',
      meaning: 'smooth',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const updateIdiom = mock(async () => idiomPayload);
const importIdiomsFromCsvFile = mock(async () => ({
  created: 1,
  skipped: 0,
  failed: 0,
  errors: [],
}));
const getPinyin = mock(async () => ({
  text: '一帆风顺',
  inDatabase: false,
  idiomId: null,
  cells: [],
}));
const searchIdioms = mock(async () => ({
  total: 0,
  items: [],
  analysis: { isUnique: false, byPosition: [], suggestedProbes: [] },
}));

mock.module('@api/application/service/idiom-service', () => ({
  createIdiom,
  getIdiom,
  deleteIdiom,
  listIdiomsPagination,
  updateIdiom,
  importIdiomsFromCsvFile,
  getPinyin,
  searchIdioms,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({}),
  }),
}));

const { idiomRoute, idiomTag } = await import(
  '@api/interface/endpoint/idiom-route'
);

const idiomId = '11111111-1111-4111-8111-111111111111';

const jsonRequest = (path: string, init?: RequestInit) =>
  idiomRoute.handle(
    new Request(`http://localhost/api/v1/idiom${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('idiomRoute', () => {
  beforeEach(() => {
    createIdiom.mockReset();
    getIdiom.mockReset();
    deleteIdiom.mockReset();
    listIdiomsPagination.mockReset();
    updateIdiom.mockReset();
    importIdiomsFromCsvFile.mockReset();
    getPinyin.mockReset();
    searchIdioms.mockReset();

    createIdiom.mockResolvedValue(idiomPayload);
    getIdiom.mockResolvedValue(idiomPayload);
    listIdiomsPagination.mockResolvedValue({
      items: [
        {
          id: 'i1',
          text: '一帆风顺',
          charCount: 4,
          pinyin: 'yi1 fan2 feng1 shun4',
          tonePattern: '1-2-1-4',
          meaning: 'smooth',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    updateIdiom.mockResolvedValue(idiomPayload);
    importIdiomsFromCsvFile.mockResolvedValue({
      created: 1,
      skipped: 0,
      failed: 0,
      errors: [],
    });
    getPinyin.mockResolvedValue({
      text: '一帆风顺',
      inDatabase: false,
      idiomId: null,
      cells: [],
    });
    searchIdioms.mockResolvedValue({
      total: 0,
      items: [],
      analysis: { isUnique: false, byPosition: [], suggestedProbes: [] },
    });
  });

  it('exports an OpenAPI tag', () => {
    expect(idiomTag.name).toBe('idiom');
  });

  it('creates an idiom', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({ text: '一帆风顺', meaning: 'smooth' }),
    });

    expect(response.status).toBe(201);
    expect(createIdiom).toHaveBeenCalledWith('一帆风顺', 'smooth');
  });

  it('gets, lists, updates, and deletes an idiom', async () => {
    const getResponse = await jsonRequest(`/${idiomId}`);
    expect(getResponse.status).toBe(200);
    expect(getIdiom).toHaveBeenCalledWith(idiomId);

    const listResponse = await jsonRequest('?page=1&pageSize=20');
    expect(listResponse.status).toBe(200);
    expect(listIdiomsPagination).toHaveBeenCalled();

    const updateResponse = await jsonRequest(`/${idiomId}`, {
      method: 'PATCH',
      body: JSON.stringify({ meaning: 'ok' }),
    });
    expect(updateResponse.status).toBe(200);
    expect(updateIdiom).toHaveBeenCalled();

    const deleteResponse = await jsonRequest(`/${idiomId}`, {
      method: 'DELETE',
    });
    expect(deleteResponse.status).toBe(200);
    expect(deleteIdiom).toHaveBeenCalledWith(idiomId);
  });

  it('imports a csv file', async () => {
    const csv = new File(['text\n一帆风顺'], 'idioms.csv', {
      type: 'text/csv',
    });
    const form = new FormData();
    form.set('file', csv);

    const response = await idiomRoute.handle(
      new Request('http://localhost/api/v1/idiom/import', {
        method: 'POST',
        body: form,
      }),
    );

    expect(response.status).toBe(200);
    expect(importIdiomsFromCsvFile).toHaveBeenCalled();
  });

  it('rejects pinyin text that is not four han characters', async () => {
    const response = await jsonRequest('/pinyin?text=abcd');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('参数应当为四个汉字');
    expect(getPinyin).not.toHaveBeenCalled();
  });

  it('returns pinyin for four han characters', async () => {
    const response = await jsonRequest(
      `/pinyin?text=${encodeURIComponent('一帆风顺')}`,
    );

    expect(response.status).toBe(200);
    expect(getPinyin).toHaveBeenCalledWith('一帆风顺');
  });

  it('searches idioms by rounds', async () => {
    const cell = {
      position: 0,
      char: '一',
      charColor: 'black',
      initial: 'y',
      initialColor: 'black',
      final: 'i',
      finalColor: 'black',
      tone: 1,
      toneColor: 'black',
      syllableLink: 'black',
    };
    const response = await jsonRequest('/search', {
      method: 'POST',
      body: JSON.stringify({
        limit: 20,
        rounds: [
          {
            text: '一帆风顺',
            cells: [
              cell,
              { ...cell, position: 1, char: '帆' },
              { ...cell, position: 2, char: '风' },
              { ...cell, position: 3, char: '顺' },
            ],
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    expect(searchIdioms).toHaveBeenCalled();
  });
});
