const fetch = require('node-fetch');

export const getBearerToken = async (apiUrl: string, body: any) => {
  const response = await fetch(`${apiUrl}/security/login`, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  });
  const data = await response.json() as { access_token: string };
  return data.access_token;
};

export const getCSRFToken = async (apiUrl: string, bearerToken: string) => {
  const headers = {
    Authorization: `Bearer ${bearerToken}`
  };
  const response = await fetch(`${apiUrl}/security/csrf_token/`, {
    method: 'get',
    headers: headers
  });
  const data = await response.json() as { result: string };;
  return data.result;
}

// To-Do: Implement this to get cookie - required for row-level-security to work
export const getCookie = async() => {
  return 'session=';
};

export const getFormattedHeaders = (bearerToken: string, csrfToken: string, cookie: string) => (
  {
    'Authorization': `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
    'X-CSRFToken': csrfToken,
    'Cookie': cookie
  }
);
