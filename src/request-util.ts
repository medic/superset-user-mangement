/**
 * Helper functions for making network requests
 */

import axios, { AxiosRequestConfig } from 'axios';
import { SUPERSET } from "./config";
import pLimit from "p-limit";

export const API_URL = (): string => {
  const url = new URL(SUPERSET.apiPath, SUPERSET.baseURL);
  return url.toString();
};

export async function fetchWithHeaders(
  endpoint: string,
  options: AxiosRequestConfig,
): Promise<{ json: any; headers: any }> {
  try {
    const finalOptions = {
      ...options,
      url: endpoint,
      withCredentials: true
    };

    const response = await axios(finalOptions);
    return { 
      json: response.data, 
      headers: response.headers 
    };
  } catch (error) {
    console.error('Fetching error:', error);
    throw error;
  }
}

export async function makeApiRequest(
  endpoint: string,
  request: AxiosRequestConfig,
): Promise<any> {
  const url = `${API_URL()}${endpoint}`;
  console.log('Request URL:', url);
  
  try {
    const finalOptions = {
      ...request,
      url,
      withCredentials: true
    };

    const response = await axios(finalOptions);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.log(
        `HTTP error! status: ${error.response.status} ${error.response.statusText}`,
      );
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
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
