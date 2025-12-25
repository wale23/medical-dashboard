/**
 * Décode un token JWT et retourne son payload
 */
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Récupère l'ID de l'utilisateur depuis le token JWT
 */
export const getUserIdFromToken = (token: string | null): string | null => {
  if (!token) return null;
  const decoded = decodeJWT(token);
  return decoded?.id || null;
};

