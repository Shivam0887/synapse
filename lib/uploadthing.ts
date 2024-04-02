import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileType } from "@/app/api/uploadthing/core";

export const { useUploadThing } = generateReactHelpers<OurFileType>();
