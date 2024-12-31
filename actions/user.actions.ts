"use server";

import ConnectToDB from "@/lib/connectToDB";
import { TActionResponse } from "@/lib/types";
import { User, UserType } from "@/models/user.model";
import { auth } from "@clerk/nextjs/server";

type TPickUserType = Pick<
  UserType,
  | "name"
  | "imageUrl"
  | "email"
  | "localImageUrl"
  | "tier"
  | "credits"
  | "stripePriceId"
  | "isAutoSave"
>;

export const getUser = async (): Promise<TActionResponse<TPickUserType>> => {
  try {
    await ConnectToDB();
    const { userId } = await auth();
    if (!userId)
      return {
        success: false,
        error: "user not authenticated",
      };

    const user = await User.findOne(
      { userId },
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

    if (!user)
      return {
        success: false,
        error: "user not found",
      };

    return {
      success: true,
      data: user._doc,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const autoSave = async (
  isChecked: boolean
): Promise<TActionResponse> => {
  try {
    await ConnectToDB();
    const { userId } = await auth();
    if (!userId)
      return {
        success: false,
        error: "user not authenticated",
      };

    const dbUser = await User.findOneAndUpdate({ userId });

    if (dbUser?.tier !== "Premium Plan") {
      return {
        success: false,
        error: "Bad request",
      };
    }

    await User.findByIdAndUpdate(dbUser?._id, {
      $set: {
        isAutoSave: isChecked,
      },
    });

    return {
      success: true,
      data: isChecked
        ? "Auto-save feature is now active!"
        : "Auto-save feature is now disabled!",
    };
  } catch (error: any) {
    console.log(error?.message);
    return {
      success: false,
      error: error?.message,
    };
  }
};
