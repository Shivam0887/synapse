"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { getGoogleListener } from "../../../_actions/workflow-action";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Filter, MoreHorizontal } from "lucide-react";
import WorkflowLoading from "../workflow-loading";

const formSchema = z.object({
  supportedAllDrives: z.enum(["true", "false"]),
  folderId: z.string(),
  restrictToMyDrive: z.enum(["true", "false"]),
  includeRemoved: z.enum(["true", "false"]),
  pageSize: z.number().default(1),
  fileId: z.string(),
});

type FormType = z.infer<typeof formSchema>;

const GoogleDriveTrigger = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSelected, setIsSelected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const workflowId = window.location.pathname.split("/").pop()!;

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormType) => {
    try {
      const response = await axios.post(
        `/api/drive/settings?workflowId=${workflowId}`,
        {
          ...values,
          changes: isSelected ? "true" : "false",
          files: isSelected ? "false" : "true",
          isListening: true,
        }
      );

      if (response.status === 201) {
        toast.success(response.data);
        setIsListening(true);
      }
      form.reset();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const onResetTrigger = async (
    e: React.MouseEvent<HTMLButtonElement> | undefined
  ) => {
    try {
      const response = await axios.post(
        `/api/drive/settings?workflowId=${workflowId}`,
        {
          folderId: "",
          fileId: "",
          supportedAllDrives: "true",
          includeRemoved: "false",
          restrictToMyDrive: "false",
          changes: "true",
          files: "false",
          isListening: false,
        }
      );

      if (response.status === 201) {
        toast.success(response.data);
        setIsListening(false);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    (async () => {
      const response = await getGoogleListener(workflowId);
      if (response) {
        const {
          changes,
          isListening,
          fileId,
          folderId,
          includeRemoved,
          restrictToMyDrive,
          supportedAllDrives,
        } = JSON.parse(response) as FormType & {
          isListening: boolean;
          changes: string;
        };

        form.setValue("fileId", fileId);
        form.setValue("folderId", folderId);
        form.setValue("includeRemoved", includeRemoved);
        form.setValue("restrictToMyDrive", restrictToMyDrive);
        form.setValue("supportedAllDrives", supportedAllDrives);

        setIsListening(isListening);

        setIsSelected(changes === "true" || changes === "");
      }
      setIsLoading(false);
    })();
  }, [workflowId, form]);

  return (
    <div className="relative">
      {isLoading ? (
        <WorkflowLoading />
      ) : (
        <div className="space-y-5 my-5">
          {!isListening ? (
            <>
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

              <>
                <div className="dark:text-neutral-400 mb-5">
                  <Filter />
                </div>
                <Form {...form}>
                  <form
                    className="flex flex-col px-1 gap-3 text-neutral-400"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    {isSelected ? (
                      <FormField
                        control={form.control}
                        name="folderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Folder Id{" "}
                              <span className="text-[#9F54FF]">?</span>
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
                          <span className="text-[#9F54FF]">?</span> - Optional
                          field
                        </p>
                      </>
                    )}

                    <Button
                      disabled={
                        form.formState.isLoading || form.formState.isSubmitting
                      }
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
              <Button variant="outline" onClick={onResetTrigger}>
                reset listerner settings
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleDriveTrigger;
