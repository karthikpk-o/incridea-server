import { env } from "~/env";
import jwt from "jsonwebtoken";

const AUTH_SECRET = env.AUTH_SECRET;

export const secrets = {
  JWT_ACCESS_SECRET: AUTH_SECRET + "access",
  JWT_REFRESH_SECRET: AUTH_SECRET + "refresh",
  JWT_VERIFICATION_SECRET: AUTH_SECRET + "verification",
  JWT_PASSWORD_RESET_SECRET: AUTH_SECRET + "password-reset",
} as const;

function generateAccessToken(user: { id: number }) {
  return jwt.sign(
    {
      userId: user.id,
    },
    secrets.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    },
  );
}

function generateRefreshToken(user: { id: number }, jti: string) {
  return jwt.sign(
    {
      userId: user.id,
      jti,
    },
    secrets.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
}

export function generateTokens(user: { id: number }, jti: string) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, jti);

  return {
    accessToken,
    refreshToken,
  };
}

export function generateVerificationToken(user: { id: number }, jti: string) {
  return jwt.sign(
    {
      userId: user.id,
      jti,
    },
    secrets.JWT_VERIFICATION_SECRET,
    {
      expiresIn: "1d",
    },
  );
}

export function generatePasswordResetToken(user: { id: number }, jti: string) {
  return jwt.sign(
    {
      userId: user.id,
      jti,
    },
    secrets.JWT_PASSWORD_RESET_SECRET,
    {
      expiresIn: "1d",
    },
  );
}
