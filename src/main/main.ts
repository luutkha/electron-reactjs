/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Store from 'electron-store';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  getWinSetting,
  saveBounds,
  isMaximized,
  saveMaximized,
} from './controller/setting';
import {
  search,
  getInfo,
  downloadManga,
  getImageLinks,
} from './controller/crawl';
import {
  mangaList,
  loadList,
  loadImages,
  openFolder,
} from './controller/local';
import { IMangaDownload, IMangaLocal } from '../interfaces';

const store = new Store();

ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (_event, key, val) => {
  store.set(key, val);
});

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// Crawl
ipcMain.handle('search', async (_handler, mangaName) => {
  return search(mangaName);
});

ipcMain.handle('getInfo', (_handler, mangaLink: string) => {
  return getInfo(mangaLink);
});

ipcMain.handle('getImages', (_handler, mangaChapter: IMangaDownload) => {
  return getImageLinks(mangaChapter.url);
});

ipcMain.handle('download', (_handler, mangaChapter: IMangaDownload) => {
  return downloadManga(mangaChapter, store.get('downloadFolder') as string);
});

// Local
ipcMain.handle('openFolder', async (_handler) => openFolder());
ipcMain.handle('listManga', (_handler, dir: string) => {
  return new Promise<IMangaLocal[]>((resolve) => {
    resolve(mangaList(dir));
  });
});
ipcMain.handle('loadList', () => {
  return loadList();
});
ipcMain.handle(
  'loadImages',
  async (_handler, name: string, chapter: string) => {
    const savePath = (await store.get('downloadFolder')) as string;
    return loadImages(savePath, name, chapter);
  }
);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const bounds = getWinSetting();

  mainWindow = new BrowserWindow({
    show: false,
    width: bounds[0],
    height: bounds[1],
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  if (isMaximized()) {
    mainWindow.maximize();
  }

  mainWindow.on('maximize', () => saveMaximized(true));
  mainWindow.on('unmaximize', () => saveMaximized(false));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('resized', () => saveBounds(mainWindow?.getSize()));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
