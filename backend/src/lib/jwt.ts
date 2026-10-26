import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, RoleKey } from '../types/domain';
import { unauthorized } from './errors';
import { randomId } from './crypto';

const baseOptions = {
  issuer: env.jwt.issuer,
  audience: env.jwt.audience
};

export interface AccessTokenInput {
  userId: string;
  tenantId: string;
  email: string;
  role: RoleKey;
  isDemo?: boolean;
}

export const signAccessToken = (input: AccessTokenInput): string =>
  jwt.sign(
    {
      sub: input.userId,
      tid: input.tenantId,
      email: input.email,
      role: input.role,
      dem: input.isDemo ?? false,
      jti: randomId('jti')
    },
    env.jwt.secret,
    {
      ...baseOptions,
      expiresIn: env.jwt.accessTokenTtl as SignOptions['expiresIn'],
      algorithm: 'HS256'
    }
  );

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const payload = jwt.verify(token, env.jwt.secret, {
      ...baseOptions,
      algorithms: ['HS256']
    }) as JwtPayload;

    if (!payload.sub || !payload.tid || !payload.role) {
      throw unauthorized('Malformed access token');
    }
    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw unauthorized('Access token expired');
    }
    throw unauthorized('Invalid access token');
  }
};

export const signRefreshToken = (): string => randomId('rt');
