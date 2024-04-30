import { CONNECTIONS } from "@/lib/constant";
import React from "react";
import ConnectionCard from "./_components/connection-card";
import { currentUser } from "@clerk/nextjs/server";
import { onDiscordConnect } from "./_actions/discord-action";
import { onNotionConnect } from "./_actions/notion-action";
import { onSlackConnect } from "./_actions/slack-action";
import { getUser } from "./_actions/get-user";
import { ConnectionsType } from "@/models/connections-model";

type ConnectionsPageProps = {
  searchParams: {
    [key: string]: string | undefined;
  };
  params: { editorId: string };
};

const ConnectionsPage = async ({
  searchParams,
  params,
}: ConnectionsPageProps) => {
  const user = await currentUser();
  const { editorId } = params;

  if (!user) return;

  const {
    webhook_id,
    webhook_name,
    webhook_url,
    guild_id,
    guild_name,
    channel_id,
    access_token,
    workspace_name,
    workspace_icon,
    workspace_id,
    database_id,
    app_id,
    authed_user_id,
    authed_user_token,
    slack_access_token,
    bot_user_id,
    team_id,
    team_name,
  } = searchParams;

  const onUserConnections = async () => {
    await onDiscordConnect({
      channelId: channel_id ?? "",
      webhookId: webhook_id ?? "",
      webhookName: webhook_name ?? "",
      webhookUrl: webhook_url ?? "",
      userId: user.id,
      guildId: guild_id ?? "",
      guildName: guild_name ?? "",
      workflowId: editorId,
    });

    await onNotionConnect({
      accessToken: access_token ?? "",
      workspaceId: workspace_id ?? "",
      workspaceIcon: workspace_icon ?? "",
      workspaceName: workspace_name ?? "",
      databaseId: database_id ?? "",
      userId: user.id,
      workflowId: editorId,
    });

    await onSlackConnect({
      appId: app_id ?? "",
      userId: user.id,
      botUserId: bot_user_id ?? "",
      teamId: team_id ?? "",
      teamName: team_name ?? "",
      slackAccessToken: slack_access_token ?? "",
      authenticated_userId: authed_user_id ?? "",
      authenticated_userToken: authed_user_token ?? "",
      workflowId: editorId,
    });

    const connections: ConnectionsType[] = JSON.parse(
      (await getUser({ userId: user.id })) as string
    );

    let isConnected: Record<string, boolean> = {};

    connections.forEach((connection) => {
      isConnected[connection.type as string] = true;
    });

    return { ...isConnected, "Google Drive": true };
  };

  const connections = await onUserConnections();

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
              connected={connections}
              description={connection.description}
              icon={connection.image}
              title={connection.title}
              type={connection.title}
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default ConnectionsPage;
