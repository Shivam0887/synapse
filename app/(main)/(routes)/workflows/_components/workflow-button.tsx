"use client";

import WorkflowForm from "@/components/forms/workflow-form";
import CustomModal from "@/components/globals/custom-modal";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/modal-provider";
import { Plus } from "lucide-react";

const WorkflowButton = () => {
  const { setOpen } = useModal();

  const handleClick = () => {
    setOpen(
      <CustomModal
        title="Create a Workflow Automation"
        subHeading="Workflows are powerful that help you to 'Automate' the tasks."
      >
        <WorkflowForm />
      </CustomModal>
    );
  };

  return (
    <Button size="icon" onClick={handleClick}>
      <Plus />
    </Button>
  );
};

export default WorkflowButton;
