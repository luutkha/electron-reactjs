interface IMangaSearchList {
  name: string;
  link: string;
  bgurl: string;
}
interface IMangaInfo {
  name: string;
  tag: string[];
  author: string;
  otherName: string;
  status: string;
  thumbnail: string;
  summary: string;
  chapters: {
    chapter: string;
    url: string;
  }[];
}
interface IFolderPath {
  canceled: boolean;
  filePaths: [string];
}
interface IMangaDownload {
  name: string;
  chapter: string;
  url: string;
}
interface IMangaLocal {
  name: string;
  chapters: string[];
}

export {
  IMangaSearchList,
  IMangaInfo,
  IFolderPath,
  IMangaDownload,
  IMangaLocal,
};
