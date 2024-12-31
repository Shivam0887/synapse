import Workflows from "../workflows/_components";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DashboardFeatures } from "@/lib/constants";
import WelcomeDashboard from "@/components/welcome-dashboard";

const DashboardPage = () => {
  return (
    <div className="h-full flex flex-col gap-4 relative">
      <div className="text-4xl sticky top-0 z-10 py-6 pl-10 backdrop-blur-lg flex items-center border-b">
        Dashboard
      </div>
      <WelcomeDashboard />
      <div className="py-6 pl-10">
        <>
          <h3 className="text-lg font-medium">Recent workflows</h3>
          <Workflows isDashboard={true} />
        </>
        <div className="flex-1 space-y-3 pr-6">
          <h3 className="text-lg font-medium">Synapse features</h3>
          <div className="w-full grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-4">
            {DashboardFeatures.map(({ content, desc, href, title }) => (
              <Card className="w-full flex flex-col" key={title}>
                <CardHeader>
                  <CardTitle className="text-[#7540A9]">{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 md2:max-w-xs w-full text-sm">
                  {content}
                </CardContent>
                <CardFooter>
                  <Link
                    href={href}
                    className={buttonVariants({ variant: "secondary" })}
                  >
                    Go to {title}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
