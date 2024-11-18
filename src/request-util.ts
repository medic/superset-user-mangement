/**
 * Helper functions for making network requests
 */

import fetch, {Headers, RequestInit} from "node-fetch";
import {SUPERSET} from "./config";
import pLimit from "p-limit";

export const API_URL = (): string => {
  const url = new URL(SUPERSET.apiPath, SUPERSET.baseURL);
  return url.toString();
};

export async function fetchWithHeaders(
  endpoint: string,
  options: RequestInit,
): Promise<{ json: any; headers: Headers }> {
  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return { json, headers: response.headers };
  } catch (error) {
    console.error('Fetching error:', error);
    throw error;
  }
}

export async function fetchRequest(
  endpoint: string,
  request: RequestInit,
): Promise<any> {
  const url = `${API_URL()}${endpoint}`;
  console.log(url);

  const response = await fetch(url, request);
  if (!response.ok) {
    console.log(
      `HTTP error! status: ${response.status} ${response.statusText}`,
    );
  }
  return await response.json();
}

/* Retry and timeout utility functions */
export async function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), timeout)
  );
  return Promise.race([promise, timeoutPromise]);
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
  timeout = 10000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await withTimeout(operation(), timeout);
    } catch (err) {
      if (i === retries - 1) {
        console.error(`Operation failed after ${retries} attempts:`, err);
        throw err;
      }
      console.warn(`Retrying operation (${i + 1}/${retries}) after failure.`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry operation failed unexpectedly.');
}

export async function executeWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrencyLimit: number
): Promise<T[]> {
  const limit = pLimit(concurrencyLimit);
  return Promise.all(tasks.map((task) => limit(task)));
}
