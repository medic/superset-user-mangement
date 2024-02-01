const fetch = require('node-fetch');

interface LoginRequest {
  username: string;
  password: string;
  provider: string
}

interface LoginResponse {
  access_token: string;
}



export const getBearerToken = async (apiUrl: string, body: LoginRequest) => {
  const response = await fetch(`${apiUrl}/security/login`, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  });

  console.log(JSON.stringify(body))
  
  const data = await response.json() as LoginResponse;
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
