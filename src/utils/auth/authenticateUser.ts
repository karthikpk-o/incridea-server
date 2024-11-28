import { YogaInitialContext } from "@graphql-yoga/node";
import { type PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";

import { secrets } from "~/utils/auth/jwt";

export async function authenticateUser(
  prisma: PrismaClient,
  request: YogaInitialContext["request"],
) {
  const header = request.headers.get("authorization");
  if (!header) return null;

  try {
    const token = header.split(" ")[1];
    if (!token) return null;

    const tokenPayload = jwt.verify(
      token,
      secrets.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

    const userId = tokenPayload.userId;

    return await prisma.user.findUnique({
      where: { id: userId },
      include: { College: true },
    });
  } catch (error) {
    return null;
  }
}
