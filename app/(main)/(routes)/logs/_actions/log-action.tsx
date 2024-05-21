"use server";

import { LIMIT } from "@/lib/constant";
import { User } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";

export const getLogs = async (pageNum: number) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("user is not authenticated");

    const skip = pageNum * LIMIT + (pageNum ? 1 : 0);

    const logs = await User.aggregate([
      { $match: { userId: user.id } },
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

    return JSON.stringify({ success: true, data: logs });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: "Internal server error." });
  }
};
