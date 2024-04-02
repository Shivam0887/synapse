import ProfileForm from "@/components/forms/profile-form";
import React from "react";
import ProfilePicture from "./_components/profile-picture";
import ConnectToDB from "@/lib/connectToDB";
import { User, UserType } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

const SettingsPage = async () => {
  const user = await currentUser();
  if (!user) return;

  ConnectToDB();
  const dbUser = await User.findOne<UserType>({ userId: user.id });

  const onImageRemove = async () => {
    "use server";
    ConnectToDB();
    await User.findByIdAndUpdate(dbUser?._id, { $set: { imageUrl: "" } });

    revalidatePath("/settings");
  };

  const updateUserInfo = async (name: string) => {
    "use server";
    ConnectToDB();
    await User.findByIdAndUpdate(dbUser?._id, { $set: { name } });

    revalidatePath("/settings");
  };

  return (
    <div className="flex flex-col gap-4">
      <h1
        className="sticky top-0 z-10 flex items-center justify-between py-6 pl-10
    text-4xl border-b bg-background/50 backdrop-blur-lg"
      >
        <span>Settings</span>
      </h1>

      <div className="flex flex-col gap-10 py-6 pl-10">
        <div>
          <h2 className="text-2xl font-bold">User Profile</h2>
          <p className="text-base text-white/50">
            Add or update your information
          </p>
        </div>
        <ProfilePicture
          imageUrl={dbUser?.imageUrl}
          onImageRemove={onImageRemove}
        />
        <ProfileForm
          name={dbUser?.name}
          email={dbUser?.email}
          updateUserInfo={updateUserInfo}
        />
      </div>
    </div>
  );
};

export default SettingsPage;
