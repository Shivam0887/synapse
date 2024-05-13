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
    { _id: 0, name: 1, imageUrl: 1, email: 1, localImageUrl: 1 }
  );

  if (!dbUser) return;
  return JSON.stringify(dbUser);
};
