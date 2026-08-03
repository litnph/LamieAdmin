const ACCESS = 'lamie_access_token';
const REFRESH = 'lamie_refresh_token';
const ACCESS_EXP = 'lamie_access_exp';
const REFRESH_EXP = 'lamie_refresh_exp';
const USER = 'lamie_user_json';

export type StoredUserSnapshot = {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  role: number;
};

const isStoredUserSnapshot = (value: unknown): value is StoredUserSnapshot =>
  typeof value === 'object'
  && value !== null
  && 'id' in value && typeof value.id === 'string'
  && 'email' in value && typeof value.email === 'string'
  && 'userName' in value && typeof value.userName === 'string'
  && 'fullName' in value && typeof value.fullName === 'string'
  && 'role' in value && typeof value.role === 'number' && Number.isInteger(value.role);

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH),

  setTokens(access: string, refresh: string, accessExp: string, refreshExp: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
    localStorage.setItem(ACCESS_EXP, accessExp);
    localStorage.setItem(REFRESH_EXP, refreshExp);
  },

  clearTokens() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(ACCESS_EXP);
    localStorage.removeItem(REFRESH_EXP);
    localStorage.removeItem(USER);
  },

  setUserSnapshot(user: StoredUserSnapshot) {
    localStorage.setItem(USER, JSON.stringify(user));
  },

  getUserSnapshot(): StoredUserSnapshot | null {
    const raw = localStorage.getItem(USER);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isStoredUserSnapshot(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
};
