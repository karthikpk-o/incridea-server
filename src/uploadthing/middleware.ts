import jwt, { JwtPayload } from "jsonwebtoken";
import { secrets } from "~/utils/auth/jwt";
import { prisma } from "~/utils/db/prisma";
import express from "express";

const authMiddleware: express.RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }
  try {
    const tokenPayload = jwt.verify(
      token,
      secrets.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

    if (tokenPayload.userId) {
      const user = await prisma.user.findUnique({
        where: { id: tokenPayload.userId },
      });

      if (!user) {
        res.status(401).json({ error: "Unauthorized: User not found" });
        return;
      }
    }

    next();
  } catch (e) {
    console.error("Token verification error:", e);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export default authMiddleware;
