import { currentUser } from "@clerk/nextjs";
import Workflow from "./workflow";
import ConnectToDB from "@/lib/connectToDB";
import { User } from "@/models/user-model";
import {
  Workflows as WorkflowsModel,
  WorkflowsType,
} from "@/models/workflows-model";
import { Ghost } from "lucide-react";

const Workflows = async () => {
  const user = await currentUser();
  ConnectToDB();
  const dbUser = await User.findOne({ userId: user?.id }, { _id: 1 });
  const workflows = await WorkflowsModel.find<WorkflowsType>({
    userId: dbUser?._id,
  }).sort({ createdAt: "desc" });

  return (
    <>
      {workflows.length ? (
        <div className="relative flex flex-col gap-4">
          <section className="flex flex-col gap-4 p-6">
            {workflows.map((workflow) => (
              <Workflow
                key={workflow._id.toString()}
                description={workflow.description}
                id={workflow._id.toString()}
                name={workflow.name}
                publish={workflow.publish}
              />
            ))}
          </section>
        </div>
      ) : (
        <div className="w-full h-[calc(100vh-170px)] flex items-center justify-center">
          <div className="flex flex-col gap-2 items-center justify-center">
            <Ghost className="w-6 h-6" />
            <p>No workflow found.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Workflows;
