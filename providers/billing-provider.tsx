"use client";

import React from "react";

type BillingProviderProps = {
  credits: string;
  tier: string;
  setCredits: React.Dispatch<React.SetStateAction<string>>;
  setTier: React.Dispatch<React.SetStateAction<string>>;
};

const initialValues: BillingProviderProps = {
  credits: "",
  setCredits: () => {},
  tier: "",
  setTier: () => {},
};

type WithChildProps = {
  children: React.ReactNode;
};

const context = React.createContext(initialValues);
const { Provider } = context;

export const BillingProvider = ({ children }: WithChildProps) => {
  const [credits, setCredits] = React.useState(initialValues.credits);
  const [tier, setTier] = React.useState(initialValues.tier);

  const values = {
    credits,
    setCredits,
    tier,
    setTier,
  };

  return <Provider value={values}>{children}</Provider>;
};

export const useBilling = () => {
  const state = React.useContext(context);
  if (!state) throw new Error("useBilling can be used within Billing Provider");
  return state;
};
