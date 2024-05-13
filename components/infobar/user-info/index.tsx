"use client";
import { getUser } from "@/app/(main)/(routes)/connections/_actions/get-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/providers/store-provider";
import { SignOutButton } from "@clerk/nextjs";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { LogOut } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const UserInfo = ({ isHome }: { isHome: boolean }) => {
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
      if (response) {
        const data = JSON.parse(response);
        setUsername(data.name);
        setLocalImageUrl(data.localImageUrl);
        setImageUrl(data.imageUrl);
        setEmail(data.email);
      }
    })();
  }, [setUsername, setLocalImageUrl, setEmail]);

  const url = localImageUrl ? localImageUrl : imageUrl;

  return (
    <div className="flex items-center gap-4">
      {username && !isHome && <p>Welcome {username}</p>}
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
                  />
                </div>
                <p>{username}</p>
              </div>
            </div>
          </DropdownMenuItem>
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

export default UserInfo;
