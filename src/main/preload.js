const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    myPing() {
      ipcRenderer.send('ipc-example', 'ping');
    },
    on(channel, func) {
      const validChannels = ['ipc-example'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      const validChannels = ['ipc-example'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
  },
  store: {
    get(val) {
      return ipcRenderer.sendSync('electron-store-get', val);
    },
    set(property, val) {
      ipcRenderer.send('electron-store-set', property, val);
    },
    // Other method you want to add like has(), reset(), etc.
  },
  openDialog: {
    open() {
      return ipcRenderer.invoke('openFolder');
    },
  },
  crawler: {
    search(mangaName) {
      return ipcRenderer.invoke('search', mangaName);
    },
    getInfo(mangaLink) {
      return ipcRenderer.invoke('getInfo', mangaLink);
    },
    getImages(mangaChapter) {
      return ipcRenderer.invoke('getImages', mangaChapter);
    },
    download(mangaChapter) {
      return ipcRenderer.invoke('download', mangaChapter);
    },
  },
  localManga: {
    listManga(dir) {
      return ipcRenderer.invoke('listManga', dir);
    },
    loadList() {
      return ipcRenderer.invoke('loadList');
    },
    loadImages(name, chapter) {
      return ipcRenderer.invoke('loadImages', name, chapter);
    },
  },
});
