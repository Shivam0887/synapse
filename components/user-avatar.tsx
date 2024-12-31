"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/providers/store-provider";
import { SignOutButton, UserProfile } from "@clerk/nextjs";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { getUser } from "@/actions/user.actions";

const UserAvatar = () => {
  const {
    localImageUrl,
    setEmail,
    setLocalImageUrl,
    email,
    setUsername,
    username,
  } = useStore();
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    (async () => {
      const response = await getUser();
      if (!response.success) {
        toast.error(response.error);
        return;
      }

      setUsername(response.data.name ?? "");
      setLocalImageUrl(response.data.localImageUrl ?? "");
      setImageUrl(response.data.imageUrl ?? "");
      setEmail(response.data.email);
    })();
  }, [setUsername, setLocalImageUrl, setEmail]);

  const url = localImageUrl ? localImageUrl : imageUrl;

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          {url && (
            <div className="relative rounded-full w-[32px] h-[32px]">
              <Image
                src={url}
                alt="profile image"
                fill
                quality={100}
                className="rounded-full"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60 space-y-2">
          <DropdownMenuItem>
            <div className="space-y-3">
              <p className="text-sm text-neutral-500">{email}</p>
              <div className=" flex items-center gap-3">
                <div className="relative rounded-full w-[24px] h-[24px]">
                  <Image
                    src={url}
                    alt="profile image"
                    fill
                    quality={100}
                    className="rounded-full"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <p>{username}</p>
              </div>
            </div>
          </DropdownMenuItem>
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="space-x-2 p-2">
                  <Settings className="w-3 h-3 text-neutral-400" />
                  <p className="text-xs">manage account</p>
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-3xl mx-auto p-6 pt-8"
                CloseBtnClassName="hidden"
              >
                <div>
                  <UserProfile
                    routing="hash"
                    appearance={{
                      elements: {
                        cardBox: "max-w-[716px] h-[512px]",
                      },
                    }}
                  />
                </div>
                <DialogClose>Close</DialogClose>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <DropdownMenuItem>
            <SignOutButton redirectUrl="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <span>logout</span>
                <LogOut className="h-4 w-4 stroke-2" />
              </div>
            </SignOutButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserAvatar;
