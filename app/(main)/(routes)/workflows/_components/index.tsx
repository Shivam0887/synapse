import { auth } from "@clerk/nextjs/server";
import Workflow from "./workflow";
import ConnectToDB from "@/lib/connectToDB";
import { User } from "@/models/user.model";
import {
  Workflow as WorkflowModel,
  WorkflowType,
} from "@/models/workflow.model";
import { Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

const Workflows = async ({ isDashboard }: { isDashboard: boolean }) => {
  const { userId } = await auth();
  await ConnectToDB();

  const dbUser = await User.findOne({ userId }, { _id: 1 });

  const result = await WorkflowModel.find<WorkflowType>({
    userId: dbUser?._id,
  }).sort({ createdAt: "desc" });

  const workflows = isDashboard ? result.slice(0, 3) : result;
  return (
    <>
      {workflows.length ? (
        <div className="relative flex-1 flex flex-col gap-4">
          <section
            className={cn("flex flex-col gap-4 p-6", { "pl-0 ": isDashboard, "h-full" : !isDashboard })}
          >
            {workflows.map((workflow) => (
              <Workflow
                key={workflow._id.toString()}
                workflowId={workflow._id.toString()}
                description={workflow.description}
                name={workflow.name}
                isPublished={workflow.publish}
                isDashboard={isDashboard}
              />
            ))}
          </section>
        </div>
      ) : (
        <div className="w-full flex-1 flex items-center justify-center">
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
