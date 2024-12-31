"use client";

import { TPlan } from "@/lib/types";
import { createContext, useContext, useMemo, useState } from "react";

type TBillingContext = {
  credits: string;
  tier: TPlan;
  setCredits: React.Dispatch<React.SetStateAction<string>>;
  setTier: React.Dispatch<React.SetStateAction<TPlan>>;
};

const initialValues: TBillingContext = {
  credits: "",
  setCredits: () => {},
  tier: "Free",
  setTier: () => {},
};

type BillingProviderProps = {
  children: React.ReactNode;
  tier: TPlan;
  credits: string;
};

const billingContext = createContext(initialValues);

export const BillingProvider = ({
  children,
  ...props
}: BillingProviderProps) => {
  const [credits, setCredits] = useState(props.credits);
  const [tier, setTier] = useState(props.tier);

  const value = useMemo(
    () => ({
      credits,
      setCredits,
      tier,
      setTier,
    }),
    [credits, tier]
  );

  return (
    <billingContext.Provider value={value}>{children}</billingContext.Provider>
  );
};

export const useBilling = () => {
  const state = useContext(billingContext);
  if (!state) throw new Error("useBilling can be used within Billing Provider");
  return state;
};
