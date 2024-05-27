import Sidebar from "@/components/sidebar";
import InfoBar from "@/components/infobar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
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
