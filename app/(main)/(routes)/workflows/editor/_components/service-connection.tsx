"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

import { CONNECTIONS } from "@/lib/constants";
import { ConnectionTypes } from "@/lib/types";
import { oauth2Url } from "@/actions/utils.actions";
import { useRouter } from "next/navigation";

const ServiceConnection = ({
  isConnected,
  selectedNodeType,
}: {
  isConnected: boolean;
  selectedNodeType: ConnectionTypes;
}) => {
  const user = useUser();
  const router = useRouter();
  const { description, image, title } = CONNECTIONS[selectedNodeType];

  return (
    <Card className="flex w-full items-center justify-between">
      <CardHeader className="space-y-4">
        <div>
          <Image
            src={image}
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
        {isConnected ? (
          <div className="border-bg-primary rounded-lg border-2 px-3 py-2 font-bold text-white">
            Connected
          </div>
        ) : (
          <button
            type="button"
            onClick={async () => {
              router.replace(`${await oauth2Url(title)}&state=${user.user?.id}`);
            }}
            className="rounded-lg bg-primary p-2 font-bold text-primary-foreground"
          >
            Connect
          </button>
        )}
      </div>
    </Card>
  );
};

export default ServiceConnection;
