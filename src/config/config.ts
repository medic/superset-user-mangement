import * as dotenv from 'dotenv';
dotenv.config();

export const SUPERSET = {
  username: getEnvironmentVariable('SUPERSET_USERNAME', 'admin'),
  password: getEnvironmentVariable('SUPERSET_PASSWORD', 'admin'),
  baseURL: getEnvironmentVariable('SUPERSET_BASE_URL', 'http://localhost:8088'),
  apiPath: getEnvironmentVariable('SUPERSET_API_PATH', '/api/v1'),
  trustSelfSigned: true,
};

export const CHA_TABLES = getEnvironmentVariable('CHA_TABLES', '[]');

export const DATA_FILE_PATH = getEnvironmentVariable(
  'DATA_FILE_PATH',
  'src/template.csv',
);

function getEnvironmentVariable(env: string, def: string) {
  if (process.env.NODE_ENV === 'test') {
    return def;
  }
  return process.env[env] || def;
}
