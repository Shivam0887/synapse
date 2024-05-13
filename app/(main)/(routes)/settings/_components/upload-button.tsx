import { useDropzone } from "@uploadthing/react";
import { useUploadThing } from "@/lib/uploadthing";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { useStore } from "@/providers/store-provider";

type UploadButtonProps = {
  setProgress: (val: number) => void;
  label: string;
};

const UploadButton = ({ setProgress, label }: UploadButtonProps) => {
  const { setLocalImageUrl } = useStore();
  const { startUpload, permittedFileInfo } = useUploadThing("imageUploader", {
    onUploadProgress: (progress) => {
      setProgress(progress);
    },
    onClientUploadComplete: (files) => {
      setProgress(0);
      setLocalImageUrl(files[0].serverData.localImageUrl);
    },
    onUploadError: (err) => {
      console.log(err.message);
    },
  });

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length) {
      await startUpload(acceptedFiles);
    }
  };

  const fileTypes = permittedFileInfo?.config
    ? Object.keys(permittedFileInfo.config)
    : [];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    multiple: false,
  });

  return (
    <>
      <div
        {...getRootProps()}
        className="mx-2 mt-3 border dark:bg-neutral-800/85 dark:hover:bg-neutral-800/70 transition duration-500 cursor-pointer flex flex-col items-center justify-center rounded-md px-4 font-medium"
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center p-2 ">
          <p className="text-foreground font-normal text-xs sm:text-sm">
            {label}
          </p>
        </div>
      </div>
    </>
  );
};

export default UploadButton;
