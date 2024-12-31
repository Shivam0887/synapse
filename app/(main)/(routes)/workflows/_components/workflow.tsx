"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CONNECTIONS } from "@/lib/constants";
import {
  deleteWorkflow,
  publishWorkflow,
  unpublishWorkflow,
} from "@/actions/workflow.actions";

type WorkflowProps = {
  workflowId: string;
  name: string;
  isPublished: boolean | undefined;
  description: string;
  isDashboard: boolean;
};

const Workflow = ({
  description,
  workflowId,
  name,
  isPublished,
  isDashboard,
}: WorkflowProps) => {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    const response = isPublished
      ? await unpublishWorkflow({ workflowId })
      : await publishWorkflow({ workflowId });

    setIsPublishing(false);

    if (!response.success) toast.error(response.error);
    else toast.success(response.data);
  };

  const handleClick = async () => {
    const response = await deleteWorkflow(workflowId);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    toast.success(response.data);
    router.refresh();
  };

  return (
    <Card className="flex items-center justify-between w-full px-3">
      <CardHeader>
        <Link
          href={`/workflows/editor/${workflowId}`}
          className={
            isDashboard
              ? "flex flex-col md:flex-row  md:items-center gap-4"
              : "space-y-3"
          }
        >
          <div className="relative flex gap-2">
            {Object.entries(CONNECTIONS).map(([_, { title, image }]) => (
              <Image
                key={title}
                src={image}
                alt={title}
                height={30}
                width={30}
                quality={100}
                className="object-contain"
              />
            ))}
          </div>
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </Link>
      </CardHeader>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-2 p-4">
          <Label htmlFor="publish" className="text-muted-foreground">
            {isPublished ? "Published" : "Unpublished"}
          </Label>
          {!isDashboard && (
            <Switch
              id="publish"
              disabled={isPublishing}
              checked={isPublished}
              onCheckedChange={handlePublish}
            />
          )}
        </div>
        <Dialog>
          <DialogTrigger>
            <Trash className="size-5 stroke-red-700" />
          </DialogTrigger>
          <DialogContent>
            <Card className="border-none">
              <CardHeader>
                <CardTitle className="text-red-500 text-lg text-center">
                  Workflow delete?
                </CardTitle>
                <CardDescription className="text-white">
                  Are you sure you want to delete this workflow? This action is
                  irreversible.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-end gap-4">
                <DialogClose
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Cancel
                </DialogClose>
                <Button variant="destructive" onClick={handleClick}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};

export default Workflow;
