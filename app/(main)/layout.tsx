import Sidebar from "@/components/globals/sidebar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex overflow-hidden h-[calc(100vh-4rem)]">
      <Sidebar />
      <div className="flex-1 h-full bg-black">{children}</div>
    </div>
  );
};

export default MainLayout;
