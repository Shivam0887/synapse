"use client";
import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import UserInfo from "./user-info";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { getWorkflows } from "@/app/(main)/(routes)/workflows/_actions/workflow-action";
import Link from "next/link";

import { useBilling } from "@/providers/billing-provider";
import { getUser } from "@/app/(main)/(routes)/connections/_actions/get-user";

const InfoBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [workflows, setWorkflows] = useState<
    { _id: string; name: string; description: string }[]
  >([]);
  const { credits, tier, setCredits, setTier } = useBilling();

  useEffect(() => {
    (async () => {
      const response = await getWorkflows();
      const data = JSON.parse(response);

      if (Array.isArray(data)) {
        setWorkflows(data);
      }
    })();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && e.ctrlKey) {
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown, false);
    return () => document.removeEventListener("keydown", handleKeyDown, false);
  }, []);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user) {
        const details = JSON.parse(user);
        setCredits(details.credits);
        setTier(details.tier);
      }
    })();
  }, [setCredits, setTier]);

  return (
    <div className="flex flex-row justify-end gap-6 items-center px-4 py-4 w-full dark:bg-black ">
      <span className="flex items-center gap-2 font-bold">
        <p className="text-sm font-light text-gray-300">Credits</p>
        {tier === "Premium Plan" ? (
          <span>Unlimited</span>
        ) : (
          <span>
            {credits}/{tier === "Free Plan" ? "10" : "100"}
          </span>
        )}
      </span>
      <div className="flex w-40 gap-2 items-center rounded-3xl bg-muted p-2">
        <Search className="h-5 w-5" />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="outline-none">
            <span className="flex items-center gap-3">
              Search <kbd className="text-xs">ctrl+/</kbd>
            </span>
          </DialogTrigger>
          <DialogContent>
            <Command>
              <CommandInput placeholder="Search for a workflow..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Workflows">
                  {workflows.map(({ _id, description, name }) => (
                    <CommandItem key={_id}>
                      <Link
                        href={`/workflows/editor/${_id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col justify-center"
                      >
                        <p className="text-sm">{name}</p>
                        <p className="text-xs text-neutral-500">
                          {description}
                        </p>
                      </Link>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      </div>

      <UserInfo isHome={false} />
    </div>
  );
};

export default InfoBar;
