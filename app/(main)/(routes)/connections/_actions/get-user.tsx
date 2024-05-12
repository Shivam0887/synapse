// "use server";

// import ConnectToDB from "@/lib/connectToDB";
// import { User, UserType } from "@/models/user-model";

// export const getUser = async ({ userId }: { userId: string }) => {
//   ConnectToDB();
//   const user = await User.findOne<UserType | null>(
//     { userId },
//     { _id: 0, connections: 1 }
//   );
//   if (!user) return;

//   return JSON.stringify(user.connections);
// };
