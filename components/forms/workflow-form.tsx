"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { toast } from "sonner";
import { createWorkflow } from "@/actions/workflow.actions";

const WorkflowFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
});

const WorkflowForm = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof WorkflowFormSchema>>({
    resolver: zodResolver(WorkflowFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof WorkflowFormSchema>) => {
    const res = await createWorkflow({
      name: values.name,
      description: values.description,
    });

    if (res.success) router.push(`/workflows/editor/${res.data}`);
    else toast.error(res.error);
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 text-left w-full border-none"
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
        <Button className="mt-4" disabled={isLoading} type="submit">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <p>Save Workflow Settings</p>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default WorkflowForm;
