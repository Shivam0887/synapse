"use server";

import ConnectToDB from "@/lib/connectToDB";
import { User, UserType } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";

export const getUser = async () => {
  ConnectToDB();
  const user = await currentUser();
  if (!user) return;

  const dbUser = await User.findOne<UserType | null>(
    { userId: user.id },
    {
      _id: 0,
      name: 1,
      imageUrl: 1,
      email: 1,
      localImageUrl: 1,
      tier: 1,
      credits: 1,
      stripePriceId: 1,
      isAutoSave: 1,
    }
  );

  if (!dbUser) return;
  return JSON.stringify(dbUser);
};

export const autoSave = async (isChecked: boolean) => {
  try {
    ConnectToDB();
    const user = await currentUser();
    const dbUser = await User.findOneAndUpdate({ userId: user?.id });

    if (dbUser?.tier !== "Premium Plan") {
      return JSON.stringify({
        success: false,
        error: "Bad request",
      });
    }

    await User.findByIdAndUpdate(dbUser?._id, {
      $set: {
        isAutoSave: isChecked,
      },
    });

    return JSON.stringify({
      success: true,
      message: isChecked
        ? "Auto-save feature is now active!"
        : "Auto-save feature is now disabled!",
    });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({
      success: false,
      error: error?.message,
    });
  }
};
