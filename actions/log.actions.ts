"use server";

import { LIMIT } from "@/lib/constants";
import { TActionResponse } from "@/lib/types";
import { Log } from "@/models/logs.model";
import { auth } from "@clerk/nextjs/server";

export const getLogs = async (
  pageNum: number
): Promise<TActionResponse<any[]>> => {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("user is not authenticated");

    const skip = pageNum * LIMIT + (pageNum ? 1 : 0);

    const logs = await Log.aggregate([
      { $match: { userId } },
      { $project: { _id: 0, logs: 1 } },
      { $unwind: "$logs" },
      { $sort: { "logs.createdAt": -1 } },
      { $skip: skip },
      { $limit: LIMIT + 1 },
      {
        $group: {
          _id: null,
          logs: {
            $push: "$logs",
          },
        },
      },
      { $project: { _id: 0, logs: 1 } },
    ]);

    return { success: true, data: logs.map(({ _id, rest }) => rest) };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, error: "Internal server error." };
  }
};
