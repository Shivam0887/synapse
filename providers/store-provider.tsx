"use client";

import type { Option } from "@/lib/types";
import React, { useState, useContext, createContext } from "react";

type initialStateType = {
  googleFile: any;
  setGoogleFile: React.Dispatch<React.SetStateAction<any>>;
  username: string;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  localImageUrl: string;
  setLocalImageUrl: React.Dispatch<React.SetStateAction<string>>;
};

const StoreContext = createContext<initialStateType>({
  googleFile: {},
  setGoogleFile: () => {},
  localImageUrl: "",
  setLocalImageUrl: () => {},
  setUsername: () => {},
  username: "",
  email: "",
  setEmail: () => {},
});

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [googleFile, setGoogleFile] = useState({});
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [localImageUrl, setLocalImageUrl] = useState("");

  const value = {
    googleFile,
    setGoogleFile,
    username,
    localImageUrl,
    setLocalImageUrl,
    setUsername,
    email,
    setEmail,
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
