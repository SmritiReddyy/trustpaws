import axios from 'axios';
import { mockRequest } from './mockApi';

const MOCK = true; // flip to false when real backend is ready

// ── Mock adapter ──────────────────────────────────────────────────────────────
function buildMockApi() {
  const handler = async (config) => {
    const url    = config.url;
    const method = config.method;
    const token  = config.headers?.Authorization?.split(' ')[1];

    let data = config.data;
    // axios serialises FormData as-is; for mock, extract plain object fields
    if (data instanceof FormData) {
      const obj = {};
      data.forEach((v, k) => { if (typeof v === 'string') obj[k] = v; });
      data = obj;
    } else if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { data = {}; }
    }

    // For parent /me we need to pass the token through
    if (url === '/parent-auth/me') data = { ...(data || {}), __token: token };

    // For GET with params (e.g. ?date=&status=)
    if (method === 'get' && config.params) data = config.params;

    try {
      return await mockRequest(method, `/api${url}`, data);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  // Fake axios-like object
  // Mirrors real axios signatures:
  //   GET:    axios.get(url, config?)        — config has { headers, params }
  //   POST:   axios.post(url, data?, config?) — config has { headers }
  const fake = {};
  ['get', 'post', 'put', 'patch', 'delete'].forEach((m) => {
    fake[m] = (url, dataOrConfig, maybeConfig) => {
      const isGet = m === 'get';
      // For GET, second arg is the config object; for others it's the data body
      const axiosConfig  = isGet ? (dataOrConfig || {}) : (maybeConfig || {});
      const passedAuth   = axiosConfig?.headers?.Authorization;
      const cfg = {
        method: m,
        url,
        headers: { Authorization: passedAuth || `Bearer ${localStorage.getItem('token')}` },
        data:   isGet ? null : dataOrConfig,
        params: isGet ? (axiosConfig?.params || {}) : (axiosConfig?.params || {}),
      };
      return handler(cfg);
    };
  });
  return fake;
}

// ── Real axios instance ───────────────────────────────────────────────────────
const realApi = axios.create({ baseURL: '/api' });

realApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

realApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const api = MOCK ? buildMockApi() : realApi;
export default api;
