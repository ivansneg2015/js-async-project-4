import nock from 'nock';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import pageLoader from '../src/index.js';

nock.disableNetConnect();

const assets = [
  {
    fileSrc: '/assets/professions/nodejs.png',
    filePath: 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png',
  },
  {
    fileSrc: '/script.js',
    filePath: 'ru-hexlet-io-courses_files/ru-hexlet-io-script.js',
  },
  {
    fileSrc: '/assets/application.css',
    filePath: 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css',
  },
  {
    fileSrc: '/courses',
    filePath: 'ru-hexlet-io-courses_files/ru-hexlet-io-courses.html',
  },
];

describe('Loading pages with commander', () => {
  const pageUrl = new URL('/courses', 'https://ru.hexlet.io');
  let output;

  beforeAll(async () => {
    output = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    assets.forEach((el) => {
      nock('https://ru.hexlet.io').persist()
        .get(el.fileSrc)
        .replyWithFile(200, path.join('__fixtures__', el.filePath));
    });

    await pageLoader(pageUrl.toString(), output);
  });

  test.each(assets)('Should download file $fileSrc', async ({ filePath }) => {
    const received = await fs.readFile(path.join(output, filePath), 'utf-8');
    const expected = await fs.readFile(path.join('__fixtures__', filePath), 'utf-8');

    expect(received).toBe(expected);
  });

  test('Should download html file', async () => {
    const fileName = 'ru-hexlet-io-courses.html';
    const received = await fs.readFile(path.join(output, fileName), 'utf-8');
    const expected = await fs.readFile(path.join('__fixtures__', fileName), 'utf-8');

    expect(received).toBe(expected);
  });
});

describe('Downloading files with errors', () => {
  const url = 'https://ru.hexlet.io/courses';
  let dirName;

  beforeAll(async () => {
    dirName = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  test.each([404, 500])('Fail with error code "%s"', async (err) => {
    const wrongUrl = 'https://ru.hexlet.io/incorrect';
    nock('https://ru.hexlet.io')
      .get('/incorrect')
      .reply(err);
    await expect(pageLoader(wrongUrl, dirName)).rejects.toThrow(`Request failed with status code ${err}`);
  });

  test('Should fail with access denied directory', async () => {
    fs.chmod(dirName, 0o400);
    await expect(pageLoader(url, dirName)).rejects.toThrow('EACCES');
  });

  test('Should fail with non-existing directory', async () => {
    await expect(pageLoader(url, '/fail/dir')).rejects.toThrow('ENOENT');
  });
});
