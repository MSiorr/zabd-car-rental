import { jwtVerify, SignJWT } from 'jose';

interface SessionPayload {
    userId: number;
    email: string;
    role: 'admin' | 'employee' | 'client';
    firstName: string;
    lastName: string;
}

const secretKey = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production';
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}
