"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { getGoogleListener } from "../../_actions/workflow-action";
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

const filterFormSchema = z.object({
  folderId: z.string().optional(),
  supportedAllDrives: z.enum(["true", "false"]),
  restrictToMyDrive: z.enum(["true", "false"]),
  includeRemoved: z.enum(["true", "false"]),
  pageSize: z.number().default(1),
});

const filterFileFormSchema = z.object({
  fileId: z.string(),
  supportedAllDrives: z.enum(["true", "false"]),
});

const GoogleDriveFiles = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSelected, setIsSelected] = useState(true);

  const workflowId = window.location.pathname.split("/").pop()!;

  const allChangeForm = useForm<z.infer<typeof filterFormSchema>>({
    resolver: zodResolver(filterFormSchema),
  });

  const fileChangeForm = useForm<z.infer<typeof filterFileFormSchema>>({
    resolver: zodResolver(filterFileFormSchema),
  });

  const onAllChange = async (values: z.infer<typeof filterFormSchema>) => {
    try {
      const response = await axios.post(
        `/api/drive-activity?workflowId=${workflowId}`,
        {
          ...values,
          changes: isSelected ? "true" : "false",
          files: isSelected ? "false" : "true",
          isListening: true,
        }
      );

      if (response.status === 200) setIsListening(true);
      if (response) toast(response.data);

      allChangeForm.reset();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const onFileChange = async (values: z.infer<typeof filterFileFormSchema>) => {
    try {
      const response = await axios.post(
        `/api/drive-activity?workflowId=${workflowId}`,
        {
          ...values,
          changes: isSelected ? "true" : "false",
          files: isSelected ? "false" : "true",
          isListening: true,
        }
      );

      if (response.status === 200) setIsListening(true);
      if (response) toast(response.data);

      fileChangeForm.reset();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const onResetTrigger = async (
    e: React.MouseEvent<HTMLButtonElement> | undefined,
    resourceUri: string | undefined = ""
  ) => {
    try {
      const response = await axios.post(
        `/api/drive-activity?workflowId=${workflowId}`,
        {
          folderId: "",
          fileId: "",
          supportedAllDrives: "true",
          includeRemoved: "false",
          restrictToMyDrive: "false",
          changes: "true",
          files: "false",
          isListening: false,
          resourceUri,
        }
      );

      if (response.status === 200) setIsListening(false);
      if (response) toast(response.data);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const onListener = useCallback(async () => {
    try {
      const listener = await getGoogleListener(workflowId);
      if (listener) {
        const res = JSON.parse(listener).googleDriveWatchTrigger;
        if (res.expiresAt < Date.now())
          onResetTrigger(undefined, res.resourceUri! as string);
        else if (res.isListening) setIsListening(true);
      }
    } catch (error: any) {
      toast.error(error?.message);
    }
    // eslint-disable-next-line
  }, [workflowId]);

  useEffect(() => {
    // onListener();
  }, [onListener]);

  return (
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
          <div>
            <div className="dark:text-neutral-400 mb-5">
              <Filter />
            </div>
            {isSelected ? (
              <Form {...allChangeForm}>
                <form
                  className="flex flex-col px-1 gap-3 text-neutral-400"
                  onSubmit={allChangeForm.handleSubmit(onAllChange)}
                >
                  <FormField
                    control={allChangeForm.control}
                    name="folderId"
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
                  <FormField
                    control={allChangeForm.control}
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
                  <FormField
                    control={allChangeForm.control}
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
                    control={allChangeForm.control}
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
                    control={allChangeForm.control}
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

                  <Button
                    disabled={
                      allChangeForm.formState.isLoading ||
                      allChangeForm.formState.isSubmitting
                    }
                    variant="outline"
                    className="mt-4"
                  >
                    {allChangeForm.formState.isSubmitting ? (
                      <MoreHorizontal className="animate-pulse" />
                    ) : (
                      "Create listener"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...fileChangeForm}>
                <form
                  className="flex flex-col px-1 gap-3 text-neutral-400"
                  onSubmit={fileChangeForm.handleSubmit(onFileChange)}
                >
                  <FormField
                    control={fileChangeForm.control}
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
                  <FormField
                    control={fileChangeForm.control}
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

                  <Button
                    disabled={
                      fileChangeForm.formState.isLoading ||
                      fileChangeForm.formState.isSubmitting
                    }
                    variant="outline"
                    className="mt-4"
                  >
                    {fileChangeForm.formState.isSubmitting ? (
                      <MoreHorizontal className="animate-pulse" />
                    ) : (
                      "Create listener"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4">
          <p>Listening to changes...</p>
          <Button variant="outline" onClick={onResetTrigger}>
            reset listerner settings
          </Button>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveFiles;
