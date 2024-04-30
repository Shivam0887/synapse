"use client";

import type { Option } from "@/lib/types";
import React, { useState, useContext, createContext } from "react";

type initialStateType = {
  googleFile: any;
  setGoogleFile: React.Dispatch<React.SetStateAction<any>>;
  slackChannels: Option[];
  setSlackChannels: React.Dispatch<React.SetStateAction<Option[]>>;
  selectedSlackChannels: Option[];
  setSelectedSlackChannels: React.Dispatch<React.SetStateAction<Option[]>>;
};

const StoreContext = createContext<initialStateType>({
  googleFile: {},
  setGoogleFile: () => {},
  selectedSlackChannels: [],
  setSelectedSlackChannels: () => {},
  setSlackChannels: () => {},
  slackChannels: [],
});

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [googleFile, setGoogleFile] = useState({});
  const [slackChannels, setSlackChannels] = useState<Option[]>([]);
  const [selectedSlackChannels, setSelectedSlackChannels] = useState<Option[]>(
    []
  );

  const value = {
    googleFile,
    setGoogleFile,
    slackChannels,
    setSlackChannels,
    selectedSlackChannels,
    setSelectedSlackChannels,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("store context can only be used within store provider.");
  }

  return store;
};
