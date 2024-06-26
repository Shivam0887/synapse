"use client";
import { getUser } from "@/app/(main)/(routes)/connections/_actions/get-user";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);

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
          <div>
            <Dialog open={open} onOpenChange={(open) => { 
              if(open) setOpen(open);
             }}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="space-x-2 p-2">
                  <Settings className="w-3 h-3 text-neutral-400" />
                  <p className="text-xs">manage account</p>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl mx-auto p-6 pt-8" CloseBtnClassName="hidden">
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
              <DialogClose onClick={() => setOpen(false)}>
                Close
              </DialogClose>
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

export default UserInfo;
