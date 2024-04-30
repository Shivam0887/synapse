import ConnectToDB from "@/lib/connectToDB";
import { User } from "@/models/user-model";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const EditorPage = async () => {
  const user = await currentUser();
  ConnectToDB();
  const dbUser = await User.findOne({ userId: user?.id }, { _id: 1 });
  const workflow = await Workflow.find<WorkflowType>({ userId: dbUser?._id })
    .sort({ createdAt: "desc" })
    .limit(1);

  if (workflow.length === 0) redirect("/workflows");

  redirect(`/workflows/editor/${workflow[0]._id.toString()}`);
};

export default EditorPage;
