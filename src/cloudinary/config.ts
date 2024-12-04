import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import { env } from "~/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    public_id: (req, _file) => {
      let { eventName } = req.params;
      if (eventName?.length) {
        const regex = /[/\\\s]/g;
        eventName = eventName.replace(regex, "_");

        return `${eventName}_${Date.now()}`;
      } else {
        return `${Date.now()}`;
      }
    },
  },
});

export const config = { cloudinary, upload: multer({ storage }) };
