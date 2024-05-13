import ConnectToDB from "@/lib/connectToDB";
import { User } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";
import { trusted } from "mongoose";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const middleware = async () => {
  const user = await currentUser();

  if (!user) throw new UploadThingError("Unauthenticated");

  return { userId: user.id };
};

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileCount: 1, maxFileSize: "4MB" } })
    .middleware(middleware)
    .onUploadComplete(async ({ metadata, file }) => {
      ConnectToDB();
      await User.findOneAndUpdate(
        {
          userId: metadata.userId,
        },
        { $set: { localImageUrl: file.url } }
      );

      return { localImageUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileType = typeof ourFileRouter;
