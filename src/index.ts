import { useDepthLimit } from "@envelop/depth-limit";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { createYoga } from "graphql-yoga";

import { config } from "~/cloudinary/config";
import { config as easterConfig } from "~/cloudinary/easterConfig";
import { config as idUploadConfig } from "~/cloudinary/idUpload";
import { uploader as imageUpload } from "~/cloudinary/upload";
import { context } from "~/context";
import { env } from "~/env";
import { schema } from "~/schema";
import { handler as razorpayCapture } from "~/webhook/capture";

const { upload } = config;
const { upload: easterUpload } = easterConfig;
const { upload: idUpload } = idUploadConfig;

const yoga = createYoga({
  context,
  schema,
  plugins: [useDepthLimit({ maxDepth: 7 })], //max depth allowed to avoid infinite nested queries
});

const app = express();

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
app.post("/cloudinary/upload/:eventName", upload.single("image"), imageUpload);
app.post("/easter-egg/upload", easterUpload.single("image"), imageUpload);
app.post("/id/upload", idUpload.single("image"), imageUpload);

app.listen(env.PORT, () => {
  console.log(`🚀 Server ready at: http://localhost:4000/graphql`);
});
