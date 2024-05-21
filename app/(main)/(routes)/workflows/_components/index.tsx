import { currentUser } from "@clerk/nextjs/server";
import Workflow from "./workflow";
import ConnectToDB from "@/lib/connectToDB";
import { User } from "@/models/user-model";
import {
  Workflow as WorkflowModel,
  WorkflowType,
} from "@/models/workflow-model";
import { Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

const Workflows = async ({ isDashboard }: { isDashboard: boolean }) => {
  const user = await currentUser();
  ConnectToDB();
  const dbUser = await User.findOne({ userId: user?.id }, { _id: 1 });
  const result = await WorkflowModel.find<WorkflowType>({
    userId: dbUser?._id,
  }).sort({ createdAt: "desc" });

  const workflows = isDashboard ? result.slice(0, 3) : result;
  return (
    <>
      {workflows.length ? (
        <div className="relative flex flex-col gap-4">
          <section
            className={cn("flex flex-col gap-4 p-6", { "pl-0": isDashboard })}
          >
            {workflows.map((workflow) => (
              <Workflow
                key={workflow._id.toString()}
                description={workflow.description}
                id={workflow._id.toString()}
                name={workflow.name}
                publish={workflow.publish}
                isDashboard={isDashboard}
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
