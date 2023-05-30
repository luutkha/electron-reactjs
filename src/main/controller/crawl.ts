/* eslint-disable no-console */
/* eslint-disable no-useless-escape */
/* eslint-disable promise/catch-or-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import axios from 'axios';
import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { IMangaSearchList, IMangaInfo, IMangaDownload } from '../../interfaces';

const createDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const search = async (mangaName: string) => {
  const mangaList = [] as IMangaSearchList[];
  const resp = await axios.get(
    `https://truyentranhlh.net/tim-kiem?q=${encodeURI(mangaName)}`
  );
  const $ = cheerio.load(resp.data);
  $('.thumb-item-flow').each((_index, el) => {
    // get link + name
    const aTag = $(el).find('.thumb_attr.series-title').find('a');
    const name = aTag.text();
    const link = aTag.attr('href');

    // get thumbnail
    const bg = $(el)
      ?.find('div.thumb-wrapper > a > div > div')
      ?.css('background-image')
      ?.trim();
    const convertBg = bg as string;
    const bgurl = convertBg.substring(5, convertBg.length - 2);
    const newlink = link as string;
    mangaList.push({
      name,
      link: newlink,
      bgurl,
    });
  });
  return mangaList;
};

const getInfo = async (mangaLink: string) => {
  const resp = await axios.get(mangaLink);
  const $ = cheerio.load(resp.data);
  const mangaInfo = <IMangaInfo>{};
  mangaInfo.name = $('.series-name a').text();
  const tagRaw = $('.badge-info');
  mangaInfo.tag = Array.from(tagRaw.map((_index, el) => $(el).text()));
  const tempArray = $('div.series-information > .info-item').toArray();
  tempArray.forEach((el) => {
    switch ($(el).find('.info-name').text()) {
      case 'Tình trạng:':
        mangaInfo.status = $(el).find('.info-value').text();
        break;
      case 'Tác giả:':
        mangaInfo.author = $(el).find('.info-value').text();
        break;
      case 'Tên khác:':
        mangaInfo.otherName = $(el).find('.info-value').text();
        break;
      default:
        break;
    }
  });
  const style = $('.series-cover > div > div').attr('style') || '';
  const imgurl = style.match(/url\(["']?([^"']*)["']?\)/);
  // eslint-disable-next-line prettier/prettier
  imgurl ? (mangaInfo.thumbnail = imgurl[1]) : null;
  mangaInfo.summary = $('div.summary-content > p').text() || '';
  const chapters = $('.list-chapters.at-series > a')
    .toArray()
    .map((link) => {
      return {
        chapter: $(link).attr('title') || '',
        url: $(link).attr('href') || '',
      };
    });
  mangaInfo.chapters = chapters;
  return mangaInfo;
};

const getImageLinks = async (chapterLink: string) => {
  const resp = await axios.get(chapterLink);
  const $ = cheerio.load(resp.data);
  const result = $('#chapter-content > img')
    .toArray()
    .map((el) => $(el).attr('data-src'));
  return result as string[];
};

const download = (
  url: string | undefined,
  name: string,
  chapter: string,
  index: number,
  DIR: string
) => {
  return new Promise<void>((resolve) => {
    https.get(url as string, (resp) => {
      const newIndex = `000${index}`.substr(-3);
      const fileStream = fs.createWriteStream(
        path.join(DIR, name, chapter, `${newIndex}.jpg`)
      );
      resp.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    });
  });
};

const downloadManga = async (mangaChapter: IMangaDownload, DIR: string) => {
  const images = await getImageLinks(mangaChapter.url);
  images.pop();
  const chapterList = [] as Promise<void>[];
  const name = mangaChapter.name.replace(/[\*\\\/\:\?\"\<\>\|]+/g, '');
  const chapter = mangaChapter.chapter.replace(/[\*\\\/\:\?\"\<\>\|]+/g, '');
  createDir(path.join(DIR, name));
  createDir(path.join(DIR, name, chapter));
  return new Promise<void>((resolve) => {
    for (let index = 0; index < images.length; index += 1) {
      chapterList.push(download(images[index], name, chapter, index + 1, DIR));
    }
    Promise.all(chapterList).then(() => resolve());
  });
};

export { search, getInfo, downloadManga, getImageLinks };
