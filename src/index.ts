import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { env } from "~/env";
import { handler as razorpayCapture } from "~/razorpay/webhook";
import { uploadThingHandler } from "~/uploadthing";
import { yoga } from "~/graphql";
import { deleteFileByUrl } from "./uploadthing/delete";

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static("public"));
app.use("/graphql", yoga.requestListener);
app.post("/webhook/capture", razorpayCapture);
app.use("/uploadthing", uploadThingHandler);
app.post("/uploadrthing/delete", deleteFileByUrl);

app.listen(env.PORT, () =>
  console.log(`🚀 Server ready at: http://localhost:4000/gr aphql`),
);
