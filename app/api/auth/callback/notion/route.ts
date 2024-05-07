import { NextRequest, NextResponse } from "next/server";
import ConnectToDB from "@/lib/connectToDB";
import { User, UserType } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";
import { Notion } from "@/models/notion-model";
import { Workflow } from "@/models/workflow-model";

const clientId = process.env.NOTION_CLIENT_ID!;
const clientSecret = process.env.NOTION_CLIENT_SECRET!;
const redirectUri = process.env.NOTION_REDIRECT_URI!;

export async function GET(req: NextRequest) {
  const user = await currentUser();
  ConnectToDB();
  const dbUser = await User.findOne<UserType>(
    { userId: user?.id },
    { currentWorkflowId: 1 }
  );

  try {
    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");

    if (code && dbUser) {
      const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      );

      const response = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${encoded}`,
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (response) {
        const data = await response.json();

        const nodeMetaData = await Workflow.findById(
          dbUser?.currentWorkflowId,
          {
            selectedNodeId: 1,
            selectedNodeType: 1,
          }
        );

        if (
          nodeMetaData?.selectedNodeId &&
          nodeMetaData.selectedNodeType === "Notion"
        ) {
          const notion = await Notion.create({
            botId: data.bot_id,
            userId: dbUser._id,
            workflowId: dbUser.currentWorkflowId,
            nodeId: nodeMetaData.selectedNodeId,
            nodeType: nodeMetaData.selectedNodeType,
            workspaceId: data.workspace_id,
            workspaceName: data.workspace_name,
            workspaceIcon: data.workspace_icon,
            accessToken: data.access_token,
          });

          await Workflow.findByIdAndUpdate(dbUser?.currentWorkflowId, {
            $push: {
              notionId: notion?._id,
            },
          });
        }

        return NextResponse.redirect(
          `http://localhost:3000/workflows/editor/${dbUser?.currentWorkflowId}`
        );
      }
    } else if (error) {
      throw new Error(error);
    }
  } catch (error: any) {
    console.log(error?.message);
    if (dbUser)
      return NextResponse.redirect(
        `http://localhost:3000/workflows/editor/${dbUser?.currentWorkflowId}`
      );
    else return NextResponse.redirect("http://localhost:3000/workflows");
  }
}
