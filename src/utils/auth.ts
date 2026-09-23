import { AuthUser } from '../types';

const AUTH_USER_KEY = 'clarifylegal_auth_user';
const AUTH_TOKEN_KEY = 'clarifylegal_jwt_token';

// Helper to create a simulated standard JWT token (base64 header.payload.signature)
export function createMockJWT(payload: Record<string, any>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64Url = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64Url(header);
  const encodedPayload = base64Url({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    iss: 'clarifylegal.ai',
  });
  const mockSignature = btoa('clarifylegal_mock_hmac_secret_sha256')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw || !token) return null;
    const user = JSON.parse(raw);
    return { ...user, token };
  } catch (err) {
    console.error('Failed to get stored auth user:', err);
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, user.token);
  } catch (err) {
    console.error('Failed to save auth user:', err);
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to clear auth session:', err);
  }
}

export function generateJudgeDemoUser(): AuthUser {
  const payload = {
    sub: 'judge-evaluator-demo-001',
    name: 'Hackathon Evaluator',
    email: 'evaluator@clarifylegal.ai',
    role: 'Judge / Evaluator',
    permissions: ['all_pro_features', 'unlimited_analyses', 'priority_genai'],
  };
  const token = createMockJWT(payload);
  const user: AuthUser = {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: 'Judge / Evaluator',
    token,
    createdAt: new Date().toISOString(),
  };
  setStoredUser(user);
  return user;
}
