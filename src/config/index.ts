/**
 * Configuration module for the application.
 * 
 * This file contains environment-specific configuration settings,
 * including Superset credentials and API details.
 * It uses dotenv to load environment variables from a .env file.
 * 
 * @module config
 */

import * as dotenv from 'dotenv';
dotenv.config();

export const SUPERSET = {
  username: getEnvironmentVariable('SUPERSET_USERNAME', 'admin'),
  password: getEnvironmentVariable('SUPERSET_PASSWORD', 'admin'),
  baseURL: getEnvironmentVariable(
    'SUPERSET_BASE_URL',
    'https://localhost:8088'
  ),
  apiPath: getEnvironmentVariable(
    'SUPERSET_API_PATH',
    '/api/v1'
  ),
  trustSelfSigned: true,
};

export const DATA_FILE_PATH = getEnvironmentVariable('DATA_FILE_PATH', 'data/wundanyi.csv');

function getEnvironmentVariable(env: string, def: string) {
  return process.env[env] ?? def;
}