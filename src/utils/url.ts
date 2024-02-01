import { URL } from 'url';

export const resolveUrl = (baseUrl: string, path: string): string => {
  const url = new URL(path, baseUrl);
  return url.toString();
};