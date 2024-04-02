import React from "react";
import Sidebar from "@/components/sidebar";
import InfoBar from "@/components/infobar";

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex !overflow-hidden h-screen">
      <Sidebar />
      <div className="flex-1 bg-black">
        <InfoBar />
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
