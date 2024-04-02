import React from "react";

type LayoutProps = { children: React.ReactNode };

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="border-l-[1px] dark:bg-background/50 border-t-[1px] pb-20 h-screen rounded-l-3xl border-muted-foreground/20 overflow-y-scroll">
      {children}
    </div>
  );
};

export default Layout;
