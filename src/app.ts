import { handler as razorpayCapture } from "~/razorpay/webhook";
import { uploadThingHandler } from "~/uploadthing";
import { yoga } from "~/graphql";
import { deleteFileByUrl } from "./uploadthing/delete";
import { certificateRouter } from "~/routers";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { env } from "~/env";

const app = express();

app.use(cors({ origin: [env.FRONTEND_URL, "https://incridea.in"] }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", express.static("public"));

app.use("/graphql", yoga.requestListener);

app.post("/webhook/capture", razorpayCapture);

app.use("/uploadthing", uploadThingHandler);
app.post("/uploadthing/delete", deleteFileByUrl);

// TODO(Omkar): Route?
app.use(certificateRouter);

export { app };
