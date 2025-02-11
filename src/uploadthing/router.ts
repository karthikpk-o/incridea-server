/* eslint-disable @typescript-eslint/only-throw-error */
import {
  createUploadthing,
  UTFiles,
  type FileRouter,
} from "uploadthing/express";
import { authenticateUser } from "~/uploadthing/authenticateUser";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  asset: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "512KB",
    },
    video: {
      maxFileCount: 1,
      maxFileSize: "512MB",
    },
    "model/gltf-binary": {
      maxFileCount: 1,
      maxFileSize: "512MB",
    },
  })
    .middleware(async ({ req, res, files }) => {
      const user = await authenticateUser(req, res);
      if (!user || user.role !== "ADMIN")
        throw new UploadThingError({
          message: "Unauthorized",
          code: "FORBIDDEN",
        });
      return {
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: "asset_" + file.name,
        })),
      };
    })
    .onUploadComplete((data) => {
      console.log("Gallery Image:", data.file.url);
    }),

  gallery: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "512KB",
    },
  })
    .middleware(async ({ req, res, files }) => {
      const user = await authenticateUser(req, res);
      if (!user || user.role !== "ADMIN")
        throw new UploadThingError({
          message: "Unauthorized",
          code: "FORBIDDEN",
        });
      return {
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: "gallery_" + file.name,
        })),
      };
    })
    .onUploadComplete((data) => {
      console.log("Gallery Image:", data.file.url);
    }),

  event: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "512KB",
    },
  })
    .middleware(async ({ req, res }) => {
      const user = await authenticateUser(req, res);
      if (!user || user.role !== "ORGANIZER")
        throw new UploadThingError({
          message: "Unauthorized",
          code: "FORBIDDEN",
        });
      return {};
    })
    .onUploadComplete((data) => {
      console.log("event Image:", data.file.url);
    }),

  quiz: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "512KB",
    },
  })
    .middleware(async ({ req, res }) => {
      const user = await authenticateUser(req, res);
      if (!user || user.role !== "ORGANIZER")
        throw new UploadThingError({
          message: "Unauthorized",
          code: "FORBIDDEN",
        });
      return {};
    })
    .onUploadComplete((data) => {
      console.log("Question Image :", data.file.url);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
