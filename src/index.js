import fsp from 'fs/promises';
import path from 'path';
import { cwd } from 'node:process';
import axios from 'axios';
import Listr from 'listr';
import debug from 'debug';
import axiosdebug from 'axios-debug-log';
import { downloadAssets, replaceName, loadingLinks } from './utils.js';

const logger = debug('page-loader');

axiosdebug({
  response(deb, response) {
    debug(
      `Response with ${response.headers['content-type']}`,
      `from ${response.config.url}`,
    );
  },
  error(deb, error) {
    debug('Error: ', error);
  },
});

export default (url, output = cwd()) => {
  const fileName = replaceName(url);
  const assetsDir = `${fileName}_files`;
  const outPath = path.join(output, assetsDir);
  const htmlFilePath = path.join(output, `${fileName}.html`);
  const { origin } = new URL(url);

  return axios.get(url)
    .then((response) => {
      logger(`Сreating directory: ${assetsDir.toString()}`);

      return fsp.mkdir(outPath)
        .then(() => (response.data));
    })
    .then((response) => {
      const { html, assets } = loadingLinks(response, assetsDir, origin);
      const tasks = assets.map(([assetsUrl, assetsFilePath]) => {
        const { href } = new URL(assetsUrl, origin);
        logger(`Downloading file ${href}`);
        return {
          title: href,
          task: () => downloadAssets(href, path.join(output, assetsFilePath)),
        };
      });
      const task = new Listr(tasks, { concurrent: true, exitOnError: false });

      return task.run(html);
    })
    .then((response) => fsp.writeFile(htmlFilePath, response))
    .then(() => htmlFilePath);
};
