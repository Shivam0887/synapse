type LayoutProps = { children: React.ReactNode };

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="border-l-[1px] rounded-l-3xl dark:bg-background/50 h-full border-muted-foreground/20 overflow-y-scroll">
      {children}
    </div>
  );
};

export default Layout;
