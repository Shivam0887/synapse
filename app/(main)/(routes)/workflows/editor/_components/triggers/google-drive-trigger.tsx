"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Filter, MoreHorizontal } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import WorkflowLoading from "@/components/workflow-loading";
import {
  getGoogleListener,
  updateGoogleDriveSettings,
} from "@/actions/google-drive.actions";

const formSchema = z.object({
  driveId: z.string(),
  supportedAllDrives: z.enum(["true", "false"]),
  restrictToMyDrive: z.enum(["true", "false"]),
  includeRemoved: z.enum(["true", "false"]),
  pageSize: z.number().default(1),
  fileId: z.string(),
});

type FormType = z.infer<typeof formSchema>;

const GoogleDriveTrigger = ({ nodeId }: { nodeId: string }) => {
  const [isSelected, setIsSelected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    (async () => {
      const response = await getGoogleListener(nodeId);
      if (!response.success) {
        toast.error(response.error);
        return;
      }

      const {
        changes,
        fileId,
        driveId,
        includeRemoved,
        restrictToMyDrive,
        supportedAllDrives,
      } = response.data;

      form.setValue("fileId", fileId);
      form.setValue("driveId", driveId);
      form.setValue("includeRemoved", includeRemoved);
      form.setValue("restrictToMyDrive", restrictToMyDrive);
      form.setValue("supportedAllDrives", supportedAllDrives);

      setIsSelected(changes === "true");
      setIsLoading(false);
    })();
  }, [nodeId, form]);

  const onSubmit = async (values: FormType) => {
    try {
      const response = await updateGoogleDriveSettings({
        nodeId,
        ...values,
        changes: isSelected ? "true" : "false",
      });

      if (response.success) toast.success(response.data);
      else toast.error(response.error);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  return (
    <div className="relative">
      <div className="space-y-5 my-5">
        <div className="flex flex-col gap-4">
          <p className="dark:text-neutral-400 text-center">
            Choose Google Drive trigger for changes
          </p>
          <div className="flex items-center justify-evenly">
            <button
              className={cn("px-3 py-2 rounded-md border font-medium", {
                "bg-white text-neutral-900": isSelected,
                "dark:hover:bg-neutral-800": !isSelected,
              })}
              type="button"
              onClick={() => setIsSelected(true)}
            >
              All Changes
            </button>
            <button
              className={cn("px-3 py-2 rounded-md border font-medium", {
                "bg-white text-neutral-900": !isSelected,
                "dark:hover:bg-neutral-800": isSelected,
              })}
              type="button"
              onClick={() => setIsSelected(false)}
            >
              File Changes
            </button>
          </div>
        </div>

        {isLoading ? (
          <WorkflowLoading />
        ) : (
          <>
            <div className="dark:text-neutral-400 mb-5">
              <Filter />
            </div>
            <Form {...form}>
              <form
                className="flex flex-col px-1 gap-3 text-neutral-400"
                onSubmit={form.handleSubmit(onSubmit, (error) =>
                  console.log(error)
                )}
              >
                {isSelected ? (
                  <FormField
                    control={form.control}
                    name="driveId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Folder Id <span className="text-[#9F54FF]">?</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="14w3t-ry2umb1uo23Jq4M0s3jcUKV971C"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="fileId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Id</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="14w3t-ry2umb1uo23Jq4M0s3jcUKV971C"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="supportedAllDrives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supported All Drives</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="support both MyDrive & SharedDrive" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isSelected && (
                  <>
                    <FormField
                      control={form.control}
                      name="includeRemoved"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Include Removed</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="want to include removed files?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">true</SelectItem>
                              <SelectItem value="false">false</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="restrictToMyDrive"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restrict To MyDrive</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="restrict to MyDrive" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">true</SelectItem>
                              <SelectItem value="false">false</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      disabled
                      control={form.control}
                      name="pageSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. of changes to track</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <p>
                      <span className="text-[#9F54FF]">?</span> - Optional field
                    </p>
                  </>
                )}

                <Button
                  disabled={form.formState.isSubmitting}
                  type="submit"
                  variant="outline"
                  className="mt-4"
                >
                  {form.formState.isSubmitting ? (
                    <MoreHorizontal className="animate-pulse" />
                  ) : (
                    "save listerner settings"
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleDriveTrigger;
