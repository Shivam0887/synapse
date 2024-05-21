import WorkflowButton from "./_components/workflow-button";
import Workflows from "./_components";

const WorkflowPage = () => {
  return (
    <div className="flex flex-col relative">
      <h1 className="sticky flex items-center justify-between top-0 z-10 bg-background/50 backdrop-blur-lg text-4xl py-6 px-10 border-b font-medium">
        Workflows
        <WorkflowButton />
      </h1>
      <Workflows isDashboard={false} />
    </div>
  );
};

export default WorkflowPage;
