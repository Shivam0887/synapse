import { ConnectionTypes } from "@/lib/types";
import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type ConnectionCardProps = {
  type: ConnectionTypes;
  icon: string;
  title: ConnectionTypes;
  description: string;
  connected?: Record<string, boolean>;
};

const ConnectionCard = ({
  description,
  type,
  icon,
  title,
  connected,
}: ConnectionCardProps) => {
  const user = useUser()
  return (
    <Card className="flex w-full items-center justify-between">
      <CardHeader className="space-y-4">
        <div>
          <Image
            src={icon}
            alt={title}
            height={30}
            width={30}
            className="object-contain"
          />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <div className="flex flex-col items-center gap-2 p-4">
        {connected && connected[type] ? (
          <div className="border-bg-primary rounded-lg border-2 px-3 py-2 font-bold text-white">
            Connected
          </div>
        ) : (
          <Link
            href={
              title == "Discord"
                ? `${process.env.NEXT_PUBLIC_DISCORD_REDIRECT!}&state=${user.user?.id}`
                : title == "Notion"
                ? `${process.env.NEXT_PUBLIC_NOTION_AUTH_URL!}&state=${user.user?.id}`
                : title == "Slack"
                ? `${process.env.NEXT_PUBLIC_SLACK_REDIRECT!}&state=${user.user?.id}`
                : "#"
            }
            className="rounded-lg bg-primary p-2 font-bold text-primary-foreground"
          >
            Connect
          </Link>
        )}
      </div>
    </Card>
  );
};

export default ConnectionCard;
