import React from "react";
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

const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-4 relative">
      <div className="text-4xl sticky top-0 z-10 py-6 pl-10 backdrop-blur-lg flex items-center border-b">
        Dashboard
      </div>
      <div className="py-6 pl-10">
        <>
          <h3 className="text-lg font-medium">Recent workflows</h3>
          <Workflows isDashboard={true} />
        </>
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Synapse features</h3>
          <div className="w-full flex items-stretch pr-6 md2:flex-nowrap flex-wrap gap-4 justify-between ">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-[#7540A9]">Workflows</CardTitle>
                <CardDescription>Create your workflow</CardDescription>
              </CardHeader>
              <CardContent className="md2:max-w-xs w-full text-sm">
                Crafting Perfect Workflows for Maximum Efficiency and
                Productivity 🚀
              </CardContent>
              <CardFooter>
                <Link
                  href="/workflows"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Go to Workflows
                </Link>
              </CardFooter>
            </Card>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-[#7540A9]">Subscription</CardTitle>
                <CardDescription>Manage your subscription</CardDescription>
              </CardHeader>
              <CardContent className="md2:max-w-xs w-full text-sm">
                Unlock 🔓 limitless potential with our subscription - your key
                to premium features! 🚀💡
              </CardContent>
              <CardFooter>
                <Link
                  href="/billing"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Manage Subscription
                </Link>
              </CardFooter>
            </Card>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-[#7540A9]">Settings</CardTitle>
                <CardDescription>
                  Manage username and profile photo
                </CardDescription>
              </CardHeader>
              <CardContent className="md2:max-w-xs w-full text-sm">
                Edit your profile photo and username as you like 😎.
              </CardContent>
              <CardFooter>
                <Link
                  href="/settings"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Go to Settings
                </Link>
              </CardFooter>
            </Card>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-[#7540A9]">Logs</CardTitle>
                <CardDescription>View apps logs</CardDescription>
              </CardHeader>
              <CardContent className="md2:max-w-xs w-full text-sm">
                Unlock 🔓 the Story Behind Your App 📱: Logging Made Simple.
              </CardContent>
              <CardFooter>
                <Link
                  href="/logs"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  View Logs
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
