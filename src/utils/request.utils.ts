import { SUPERSET } from "../config";
import pLimit from "p-limit";
import { AuthService } from "../service/auth-service";
import { Logger } from "./logger";
import fetch, { RequestInit, Response } from "node-fetch";

export const API_URL = (): string => {
  const url = new URL(SUPERSET.apiPath, SUPERSET.baseURL);
  return url.toString();
};

/* Retry and timeout utility functions */
export async function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    ),
  ]);
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
  timeout = 10000
): Promise<T> {
  try {
    return await withTimeout(operation(), timeout);
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryOperation(operation, retries - 1, delay, timeout);
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
  }
  return response.json();
}

export async function handleRequest(url: string, options: RequestInit = {}) {
  try {
    const headers = await AuthService.getInstance().getHeaders();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': headers.Authorization,
        'X-CSRFToken': headers['X-CSRFToken'],
        'Content-Type': 'application/json',
        'Cookie': headers.Cookie
      }
    });
    return handleResponse(response);
  } catch (error) {
    Logger.error(`Fetch error for ${url}: ${error}`);
    throw error;
  }
}

export async function executeWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrencyLimit: number
): Promise<T[]> {
  const limit = pLimit(concurrencyLimit);
  return Promise.all(tasks.map(task => limit(task)));
}
