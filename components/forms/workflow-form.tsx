import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createWorkflow } from "@/app/(main)/(routes)/workflows/_actions/workflow-action";
import { toast } from "sonner";
import { useModal } from "@/providers/modal-provider";

const WorkflowFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
});

type WorkflowFormProps = {
  title?: string;
  subTitle?: string;
};

const WorkflowForm = ({ subTitle, title }: WorkflowFormProps) => {
  const form = useForm<z.infer<typeof WorkflowFormSchema>>({
    resolver: zodResolver(WorkflowFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const router = useRouter();
  const { setClose } = useModal();

  const onSubmit = async (values: z.infer<typeof WorkflowFormSchema>) => {
    const res = await createWorkflow({
      name: values.name,
      description: values.description,
    });

    setClose();
    if (res?.success) {
      router.push(`/workflows/editor/${res?.workflowId}`);
    }
    toast(res?.message);
  };

  const isLoading = form.formState.isLoading;

  return (
    <Card className="w-full max-w-[650px] border-none">
      {title && subTitle && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subTitle}</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-4 text-left"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              disabled={isLoading}
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My workflow" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Description..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="mt-4 max-w-max"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <p>Save Workflow Settings</p>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WorkflowForm;
