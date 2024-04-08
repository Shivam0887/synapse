import { CONNECTIONS } from "@/lib/constant";
import React from "react";
import ConnectionCard from "./_components/connection-card";

type ConnectionsPageProps = {
  searchParams: {
    [key: string]: string | undefined;
  };
};

const ConnectionsPage = ({ searchParams }: ConnectionsPageProps) => {
  return (
    <div className="relative flex flex-col gap-4">
      <h1 className="sticky top-0 py-6 pl-10 z-10 flex items-center justify-between border-b bg-background/50 text-4xl backdrop-blur-lg">
        Connections
      </h1>
      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col gap-4 py-6 px-10 text-muted-foreground">
          Connect all your apps directly from here. You may need to connect
          these apps regularly to refresh verification.
          {CONNECTIONS.map((connection) => (
            <ConnectionCard
              key={connection.title}
              //   connected={connection.connectionKey}
              description={connection.description}
              icon={connection.image}
              title={connection.title}
              type={connection.title}
              callback={() => {}}
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default ConnectionsPage;
