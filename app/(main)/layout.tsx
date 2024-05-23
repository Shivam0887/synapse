import React from "react";
import Sidebar from "@/components/sidebar";
import InfoBar from "@/components/infobar";
import { BillingProvider } from "@/providers/billing-provider";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex !overflow-hidden h-screen">
      <BillingProvider>
        <Sidebar />
        <div className="flex-1 bg-black">
          <InfoBar />
          {children}
        </div>
      </BillingProvider>
    </div>
  );
};

export default MainLayout;
