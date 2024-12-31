import AddWorkflowButton from "./_components/add-workflow-button";
import Workflows from "./_components";

const WorkflowPage = () => {
  return (
    <div className="h-full flex flex-col relative">
      <div className="sticky flex items-center justify-between top-0 z-10 bg-background/50 backdrop-blur-lg py-6 px-10 border-b">
        <h1 className="text-4xl font-medium">Workflows</h1>
        <AddWorkflowButton />
      </div>
      <Workflows isDashboard={false} />
    </div>
  );
};

export default WorkflowPage;
