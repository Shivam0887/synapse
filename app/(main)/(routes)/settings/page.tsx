import ProfileForm from "@/components/forms/profile-form";
import React from "react";
import ProfilePicture from "./_components/profile-picture";
import ConnectToDB from "@/lib/connectToDB";
import { User, UserType } from "@/models/user.model";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { absolutePathUrl } from "@/lib/utils";
import axios from "axios";

const SettingsPage = async () => {
  const user = await currentUser();
  if (!user) return;

  await ConnectToDB();
  const dbUser = await User.findOne<UserType>({ userId: user.id }, { _id: 1 });

  const onImageRemove = async () => {
    "use server";
    await ConnectToDB();
    await User.findByIdAndUpdate(dbUser?._id, { $set: { localImageUrl: "" } });

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${user?.id}`, {
      status: true,
      action: "User Info",
      message: `Profile photo removed successfully!`,
    });

    revalidatePath("/settings");
  };

  const updateUserInfo = async (name: string) => {
    "use server";
    await ConnectToDB();
    await User.findByIdAndUpdate(dbUser?._id, { $set: { name } });

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${user?.id}`, {
      status: true,
      action: "User Info",
      message: `Username changed successfully!`,
    });
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <h1
        className="sticky top-0 z-10 flex items-center justify-between py-6 pl-10
    text-4xl border-b bg-background/50 backdrop-blur-lg"
      >
        <span>Settings</span>
      </h1>

      <div className="flex-1 flex flex-col gap-10 py-6 pl-10">
        <div>
          <h2 className="text-2xl font-bold">User Profile</h2>
          <p className="text-base text-white/50">
            Add or update your information
          </p>
        </div>
        <ProfilePicture onImageRemove={onImageRemove} />
        <ProfileForm updateUserInfo={updateUserInfo} />
      </div>
    </div>
  );
};

export default SettingsPage;
