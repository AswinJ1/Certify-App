import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentUser } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Certificate template upload (PDF or image background)
  templateUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 1 },
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    blob: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Template upload complete for userId:", metadata.userId);
      console.log("file url:", file.ufsUrl);
      return { url: file.ufsUrl, key: file.key, name: file.name };
    }),

  // Dataset upload (CSV/XLSX)
  datasetUploader: f({
    blob: { maxFileSize: "32MB", maxFileCount: 1 },
    text: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Dataset upload complete for userId:", metadata.userId);
      console.log("file url:", file.ufsUrl);
      return { url: file.ufsUrl, key: file.key, name: file.name };
    }),

  // Organization / Event logo upload
  logoUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    blob: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Logo upload complete for userId:", metadata.userId);
      return { url: file.ufsUrl, key: file.key, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
