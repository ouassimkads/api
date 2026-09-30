import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'session';

const SESSION_DURATION = '7d';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET is not set. Add it to your .env file.');
  }

  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  email: string;
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (typeof payload.email !== 'string') {
      return null;
    }

    return { email: payload.email };
  } catch {
    // Expired, tampered, or malformed token.
    return null;
  }
}
