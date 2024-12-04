import { type YogaInitialContext } from "@graphql-yoga/node";
import { type PrismaClient } from "@prisma/client";
import jwt, { type JwtPayload } from "jsonwebtoken";

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

    const payload = jwt.verify(token, secrets.JWT_ACCESS_SECRET) as JwtPayload;

    return await prisma.user.findUnique({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: payload.userId,
      },
      include: { College: true },
    });
  } catch (error) {
    console.log(error);
  }
}
