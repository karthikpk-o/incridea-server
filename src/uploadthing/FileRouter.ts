import { createUploadthing, type FileRouter } from "uploadthing/express";
import authMiddleware from "./middleware";
const f = createUploadthing();

export const uploadRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  eventUploader: f({
    image: {
      /**
       * For full list of options and defaults and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const userDetail = await authMiddleware(req);
      return { userId: userDetail };
    })
    .onUploadComplete(async (data) => {
      console.log("upload completed", data.req);
    }),

  easterEggUploader: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "4MB",
    },
  }).onUploadComplete((data) => {
    console.log("easter Egg uploaded");
  }),

  idUploader: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "4MB",
    },
  }).onUploadComplete((data) => {
    console.log("id uploaded");
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
