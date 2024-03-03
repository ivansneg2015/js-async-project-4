import axios from 'axios';
import path from 'path';
import * as cheerio from 'cheerio';
import fsp from 'fs/promises';

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

export const downloadAssets = (url, filePath) => axios
  .get(url, { responseType: 'arraybuffer' })
  .then(({ data }) => fsp.writeFile(filePath, data));

export const replaceName = (url) => url.replace(new URL(url).protocol, '')
  .split(/[^\d\sA-Z]/gi)
  .filter((el) => el !== '')
  .join('-');

export const loadingLinks = (data, dirName, origin) => {
  const $ = cheerio.load(data);

  const assets = Object.entries(mapping)
    .flatMap(([tagName, attr]) => $(tagName).toArray()
      .map((el) => $(el))
      .map(($element) => ({
        $element,
        url: new URL($element.attr(attr), origin),
        attr,
      })))
    .filter(({ url }) => url.origin === origin)
    .reduce((acc, { $element, url, attr }) => {
      const { dir, name, ext } = path.parse(new URL(url, origin).href);
      const fileExtension = ext || '.html';
      const filename = replaceName(path.join(dir, name)).concat(fileExtension);
      const filePath = path.join(dirName, filename);

      $element.attr(attr, filePath);

      return [...acc, [url, filePath]];
    }, []);

  return { html: $.html(), assets };
};
