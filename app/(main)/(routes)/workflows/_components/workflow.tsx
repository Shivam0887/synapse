"use client";

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
import { deleteWorkflow, onPublishWorkflow } from "../_actions/workflow-action";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type WorkflowProps = {
  id: string;
  name: string;
  publish: boolean | undefined;
  description: string;
  isDashboard: boolean;
};

const Workflow = ({
  description,
  id,
  name,
  publish,
  isDashboard,
}: WorkflowProps) => {
  const router = useRouter();

  const onPublish = async (checked: boolean) => {
    const response = await onPublishWorkflow({
      workflowId: id,
      publish: checked,
    });
    if (response) {
      const data = JSON.parse(response);
      toast.message(data.message);
    }
  };

  const handleClick = async () => {
    const response = await deleteWorkflow(id);
    if (response) {
      const data = JSON.parse(response);
      if (data.success) {
        toast.success(data.message);
        router.refresh();
      } else toast.error(data.error);
    }
  };

  return (
    <Card className="flex items-center justify-between w-full px-3">
      <CardHeader className="flex flex-col gap-4">
        <Link
          href={`/workflows/editor/${id}`}
          className={isDashboard ? "flex items-center gap-4" : "space-y-3"}
        >
          <div className="flex gap-2">
            <Image
              src="/googleDrive.png"
              alt="Google Drive"
              height={30}
              width={30}
              quality={100}
              className="object-contain"
            />
            <Image
              src="/notion.png"
              alt="Notion"
              height={30}
              width={30}
              quality={100}
              className="object-contain"
            />
            <Image
              src="/discord.png"
              alt="Discord"
              height={30}
              width={30}
              quality={100}
              className="object-contain"
            />
            <Image
              src="/slack.png"
              alt="Slack"
              height={30}
              width={30}
              quality={100}
              className="object-contain"
            />
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
            {publish ? "Published" : "Unpublished"}
          </Label>
          {!isDashboard && (
            <Switch
              id="publish"
              checked={publish}
              onCheckedChange={onPublish}
            />
          )}
        </div>
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <MoreVertical />
            </DropdownMenuTrigger>
            <DialogTrigger>
              <DropdownMenuContent
                className="p-2 min-w-max"
                align="end"
                sideOffset={20}
              >
                <DropdownMenuItem className="flex max-w-max cursor-pointer items-center gap-2">
                  <Trash className="w-4 h-4 text-red-600" />
                  <span className="text-sm">delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DialogTrigger>
          </DropdownMenu>
          <DialogContent>
            <Card className="border-none">
              <CardHeader>
                <CardTitle className="text-red-500 text-lg text-center">
                  Workflow delete?
                </CardTitle>
                <CardDescription className="text-[18px] text-white">
                  Are you sure you want to delete this workflow? This action is
                  irreversible.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between">
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
