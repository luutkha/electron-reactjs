import fs from 'fs';
import path from 'path';
import Store from 'electron-store';
import { dialog } from 'electron';
import { IMangaLocal } from '../../interfaces';

const store = new Store();

const mangaList = async (dir: string) => {
  try {
    const list = fs.readdirSync(dir);
    const result = [] as IMangaLocal[];
    list.forEach((el) => {
      const uncheckPath = path.join(dir, el);
      if (fs.lstatSync(uncheckPath).isDirectory()) {
        const chapters = fs.readdirSync(uncheckPath);
        result.push({ name: el, chapters });
      }
    });
    store.set('localList', result);
    return result;
  } catch (error) {
    return [] as IMangaLocal[];
  }
};

const loadList = () => {
  return store.get('localList') as IMangaLocal[];
};

const loadImages = async (dir: string, name: string, chapter: string) => {
  const imagesPath = path.join(dir, name, chapter);
  const result = fs.readdirSync(imagesPath);
  const imagesOnly = result.filter(
    (value) => path.extname(value) in ['.jpg', '.jpeg', '.png']
  );
  return imagesOnly;
};
const openFolder = () => {
  return new Promise((resolve, reject) => {
    const result = dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    // eslint-disable-next-line promise/catch-or-return
    result.then((res) => {
      if (!res.canceled) {
        store.set('downloadFolder', res.filePaths[0]);
      }
      return resolve(res);
    });
    result.catch((err) => {
      reject(err);
    });
  });
};

export { mangaList, loadList, loadImages, openFolder };
