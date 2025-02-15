import { handler as razorpayCapture } from "~/razorpay/webhook";
import { yoga } from "~/graphql";
import { certificateRouter } from "~/routers";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { env } from "~/env";
import { UTApiRouter } from "~/uploadthing/api";

const app = express();

app.use(cors({ origin: [env.FRONTEND_URL] }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", express.static("public"));

app.use("/graphql", yoga.requestListener);

app.post("/webhook/capture", razorpayCapture);

app.use("/uploadthing", UTApiRouter);

// TODO(Omkar): Route?
app.use(certificateRouter);

export { app };
