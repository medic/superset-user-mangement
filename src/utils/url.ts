import url from 'url';

export const resolveUrl = (baseUrl: string, path: string) =>
  url.resolve(baseUrl, path);
