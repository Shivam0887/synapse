"use server";

import ConnectToDB from "@/lib/connectToDB";
import { currentUser } from "@clerk/nextjs/server";
import { Slack } from "@/models/slack-model";
import { User } from "@/models/user-model";

export const getSlackMetaData = async (workflowId: string, nodeId: string) => {
  try {
    ConnectToDB();
    const user = await currentUser();

    const dbUser = await User.findOne({ userId: user?.id });

    if (dbUser) {
      const slack = await Slack.findOne({
        userId: dbUser?._id,
        workflowId,
        nodeId,
      });

      if (slack) {
        return JSON.stringify(slack);
      }
    }
  } catch (error: any) {
    console.log(error?.message);
  }
};
