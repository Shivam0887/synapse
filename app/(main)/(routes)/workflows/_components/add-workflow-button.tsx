"use client";

import WorkflowForm from "@/components/forms/workflow-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AddWorkflowButton = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(768 <= window.innerWidth);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button size="icon">
            <Plus />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a Workflow Automation</DialogTitle>
            <DialogDescription>
              Workflows are powerful that help you to 'Automate' the tasks.
            </DialogDescription>
          </DialogHeader>

          <WorkflowForm />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="icon">
          <Plus />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md space-y-4">
          <DrawerHeader>
            <DrawerTitle>Create a Workflow Automation</DrawerTitle>
            <DrawerDescription>
              Workflows are powerful that help you to 'Automate' the tasks.
            </DrawerDescription>
          </DrawerHeader>
          <WorkflowForm />
          <DrawerFooter className="bg-background border-t-[1px] border-t-muted">
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddWorkflowButton;
