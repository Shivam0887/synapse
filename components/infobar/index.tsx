"use client";
import React, { useEffect } from "react";
import { Book, Headset, Search } from "lucide-react";
import Templates from "@/components/icons/cloud_download";
import { Input } from "@/components/ui/input";

import { TooltipProvider } from "@/components/ui/tooltip";
import { UserButton } from "@clerk/nextjs";
import ActionTooltip from "../globals/action-tooltip";
import { Button } from "../ui/button";

// import { useBilling } from '@/providers/billing-provider'
// import { onPaymentDetails } from '@/app/(main)/(pages)/billing/_actions/payment-connecetions'

type Props = {};

const InfoBar = (props: Props) => {
  //   const { credits, tier, setCredits, setTier } = useBilling()

  //   const onGetPayment = async () => {
  //     const response = await onPaymentDetails()
  //     if (response) {
  //       setTier(response.tier!)
  //       setCredits(response.credits!)
  //     }
  //   }

  //   useEffect(() => {
  //     onGetPayment()
  //   }, [])

  return (
    <div className="flex flex-row justify-end gap-6 items-center px-4 py-4 w-full dark:bg-black ">
      {/* <span className="flex items-center gap-2 font-bold">
        <p className="text-sm font-light text-gray-300">Credits</p>
        {tier == 'Unlimited' ? (
          <span>Unlimited</span>
        ) : (
          <span>
            {credits}/{tier == 'Free' ? '10' : tier == 'Pro' && '100'}
          </span>
        )}
      </span> */}
      <span className="flex items-center rounded-full bg-muted p-3">
        <Search />
        <input
          type="text"
          placeholder="Quick Search"
          className="border-none bg-transparent ml-2 outline-none"
        />
      </span>
      <TooltipProvider>
        <ActionTooltip label={<Headset />} sideOffset={10}>
          <p>Contact Support</p>
        </ActionTooltip>
      </TooltipProvider>
      <TooltipProvider>
        <ActionTooltip label={<Book />} sideOffset={10}>
          <p>Guide</p>
        </ActionTooltip>
      </TooltipProvider>
      <UserButton afterSignOutUrl="/" />
    </div>
  );
};

export default InfoBar;
