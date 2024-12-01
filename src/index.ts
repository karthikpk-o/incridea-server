import { useDepthLimit } from "@envelop/depth-limit";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { createYoga } from "graphql-yoga";
import { createRouteHandler } from "uploadthing/express";
import { context } from "~/context";
import { env } from "~/env";
import { schema } from "~/schema";
import { handler as razorpayCapture } from "~/webhook/capture";
import { uploadRouter } from "./uploadthing";
import jwt, { JwtPayload } from "jsonwebtoken";
import { secrets } from "./utils/auth/jwt";
import { authenticateUser } from "./utils/auth/authenticateUser";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./utils/db/prisma";

const yoga = createYoga({
  context,
  schema,
  plugins: [useDepthLimit({ maxDepth: 7 })], //max depth allowed to avoid infinite nested queries
});

const app = express();
const authMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
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
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }
    }

    next(); // Call next to proceed to the next middleware or route handler
  } catch (e) {
    console.error("Token verification error:", e);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.send("Hello Incridea");
});

app.use("/graphql", yoga.requestListener);
app.post("/webhook/capture", razorpayCapture);
app.use(
  "/uploadthing",
  authMiddleware,
  createRouteHandler({
    router: uploadRouter,
    config: { token: env.UPLOADTHING_SECRET },
  }),
);

app.listen(env.PORT, () => {
  console.log(`🚀 Server ready at: http://localhost:4000/graphql`);
});

// const { upload } = config;
// const { upload: easterUpload } = easterConfig;
// const { upload: idUpload } = idUploadConfig;

// app.post("/cloudinary/upload/:eventName", upload.single("image"), imageUpload);
// app.post("/easter-egg/upload", easterUpload.single("image"), imageUpload);
// app.post("/id/upload", idUpload.single("image"), imageUpload);

// import { uploader as imageUpload } from "./cloudinary/upload";
// import { config } from "./cloudinary/config";
// import { config as easterConfig } from "./cloudinary/easterConfig";
// import { config as idUploadConfig } from "./cloudinary/idUpload";

// // import "./certificate.ts";
// import jwt from 'jsonwebtoken';
