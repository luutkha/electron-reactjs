/* eslint-disable prettier/prettier */
import Store from 'electron-store';

const store = new Store();

const getWinSetting = () => {
  const defaultBounds = [1024, 728];
  const size = store.get('winSize', defaultBounds);
  const numSize = size as number[]
  return numSize;
};
const saveBounds = (size: number[] | undefined) => {
  store.set('winSize', size);
};
const isMaximized = () => {
  if (store.get('isMaximized')) return true;
  return false;
};
const saveMaximized = (isMax: boolean) => {
  store.set('isMaximized', isMax);
};

export {
  getWinSetting,
  saveBounds,
  isMaximized,
  saveMaximized,
};
