"use client";

import { useState } from "react";
import UploadButton from "./upload-button";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { useStore } from "@/providers/store-provider";

type ProfilePictureProps = {
  onImageRemove: () => Promise<void>;
};

const ProfilePicture = ({ onImageRemove }: ProfilePictureProps) => {
  const router = useRouter();
  const { localImageUrl, setLocalImageUrl } = useStore();
  const [progress, setProgress] = useState(0);

  return (
    <div className="flex flex-col">
      <p className="text-lg text-white">Profile Picture</p>
      <div className="flex max-w-sm flex-col items-center justify-center mt-5">
        {localImageUrl ? (
          <>
            <div className="relative group">
              <div className="rounded-full w-[80px] h-[80px] overflow-hidden">
                <Image
                  src={localImageUrl}
                  alt="profile photo"
                  fill
                  quality={100}
                  className="object-cover rounded-full object-center"
                />
              </div>
              <div
                onClick={async () => {
                  setLocalImageUrl("");
                  await onImageRemove();
                }}
                className="absolute top-0 -translate-y-[12.5%] right-0 translate-x-[12.5%] rounded-full backdrop-blur-lg"
              >
                <button className="p-2 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div
                role="button"
                className="opacity-0 group-hover:opacity-100 absolute -right-24 transition top-1/2 -translate-y-1/2"
              >
                <UploadButton setProgress={setProgress} label="edit" />
              </div>
            </div>
          </>
        ) : (
          <UploadButton
            setProgress={setProgress}
            label="Click to upload or drag & drop"
          />
        )}
        {progress > 0 && progress < 100 && (
          <div className="flex items-center justify-center p-1 gap-2 mt-3">
            <Loader2 className="w-3 h-3 animate-spin" />
            <p className="text-xs">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePicture;
