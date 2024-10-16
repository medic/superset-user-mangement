/**
 * Superset access configs
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

export const DATA_FILE_PATH = getEnvironmentVariable('DATA_FILE_PATH', 'src/wundanyi.csv');

function getEnvironmentVariable(env: string, def: string) {
  return process.env[env] ?? def;
}