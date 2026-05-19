export const AUTH_EXPIRED_EVENT = 'lamie:auth-expired';

export const emitAuthExpired = () => {
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
};
