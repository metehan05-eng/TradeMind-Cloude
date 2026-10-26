const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const SESSION_KEY = 'trademind.session';

export class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
};

export const storeSession = (session) => {
  if (!session) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => localStorage.removeItem(SESSION_KEY);

export const getAccessToken = () => getSession()?.accessToken;

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, token, headers = {}, isForm = false } = options;
  const session = getSession();
  const authToken = token ?? session?.accessToken;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { 'content-type': 'application/json' }),
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      ...headers
    },
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(
      error?.message || `Request failed (${response.status})`,
      error?.code,
      response.status,
      error?.details
    );
  }
  return payload?.data ?? payload;
};

export const api = {
  baseUrl: API_BASE_URL,
  login: (body) => apiRequest('/api/v1/auth/login', { method: 'POST', body }),
  discoverSso: (email) =>
    apiRequest(`/api/v1/auth/sso/discover?email=${encodeURIComponent(email)}`),
  me: () => apiRequest('/api/v1/auth/me'),
  demoRequest: (body) => apiRequest('/api/v1/demo/requests', { method: 'POST', body }),
  demoConfirm: (token) => apiRequest('/api/v1/demo/confirm', { method: 'POST', body: { token } }),
  providers: () => apiRequest('/api/v1/integrations/oauth/providers'),
  connections: () => apiRequest('/api/v1/integrations/oauth/connections'),
  authorizeProvider: (provider, body = {}) =>
    apiRequest(`/api/v1/integrations/oauth/${provider}/authorize`, { method: 'POST', body }),
  connectSandbox: (provider, accountLabel) =>
    apiRequest(`/api/v1/integrations/oauth/${provider}/sandbox-connect`, {
      method: 'POST',
      body: accountLabel ? { accountLabel } : {}
    }),
  disconnect: (id) =>
    apiRequest(`/api/v1/integrations/oauth/connections/${id}`, { method: 'DELETE' }),
  apiKeys: () => apiRequest('/api/v1/integrations/api-keys'),
  createApiKey: (body) =>
    apiRequest('/api/v1/integrations/api-keys', { method: 'POST', body }),
  revokeApiKey: (id) =>
    apiRequest(`/api/v1/integrations/api-keys/${id}`, { method: 'DELETE' }),
  notificationChannels: () => apiRequest('/api/v1/notifications/channels'),
  createNotificationChannel: (body) =>
    apiRequest('/api/v1/notifications/channels', { method: 'POST', body }),
  members: () => apiRequest('/api/v1/rbac/members'),
  roles: () => apiRequest('/api/v1/rbac/roles'),
  verificationStatus: () => apiRequest('/api/v1/auth/verification/status')
};
