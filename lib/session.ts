// Gestion des jetons de session (compatible Edge et Node)
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'elise_session';
export const SESSION_DURATION_H = 12;

export type Role = 'superadmin' | 'utilisateur';
export type SessionUser = { id: number; nom: string; email: string; role: Role };

function secret() {
  const s = (process.env.JWT_SECRET || '').trim();
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET manquant ou trop court (variables d’environnement).');
  }
  return new TextEncoder().encode(s);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_H}h`)
    .sign(secret());
}

export async function verifySession(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: Number(payload.id),
      nom: String(payload.nom),
      email: String(payload.email),
      role: payload.role === 'superadmin' ? 'superadmin' : 'utilisateur',
    };
  } catch {
    return null;
  }
}
