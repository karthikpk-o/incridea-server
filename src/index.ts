import { createYoga } from "graphql-yoga";
import cors from "cors";
import express from "express";
import { context } from "./context";
import { schema } from "./schema";
import bodyParser from "body-parser";
import { handler as razorpayCapture } from "./webhook/capture";

import { useDepthLimit } from "@envelop/depth-limit";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing";
const port = Number(process.env.API_PORT) || 4000;

const yoga = createYoga({
  context,
  schema,
  plugins: [useDepthLimit({ maxDepth: 7 })], //max depth allowed to avoid infinite nested queries
});

const app = express();
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization; 
  console.log("Authorization Header:", authHeader);
  next();
};

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.send("Hello Incridea");
});

app.use("/graphql", yoga.requestListener);
app.post("/webhook/capture", razorpayCapture);
app.use("/uploadthing",authMiddleware,createRouteHandler({router: uploadRouter}),);


app.listen(port, () => {
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