import ConnectToDB from "@/lib/connectToDB";
import { User } from "@/models/user-model";
import { Workflows, WorkflowsType } from "@/models/workflows-model";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const EditorPage = async () => {
  const user = await currentUser();
  ConnectToDB();
  const dbUser = await User.findOne({ userId: user?.id }, { _id: 1 });
  const workflow = await Workflows.find<WorkflowsType>({ userId: dbUser?._id })
    .sort({ createdAt: "desc" })
    .limit(1);

  if (workflow.length === 0) redirect("/workflows");

  redirect(`/workflows/editor/${workflow[0]._id.toString()}`);
};

export default EditorPage;
