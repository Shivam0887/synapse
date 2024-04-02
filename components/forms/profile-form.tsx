"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ProfileSchema } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

type ProfileFormProps = {
  name: string | null | undefined;
  email: string | null | undefined;
  updateUserInfo: (val: string) => Promise<void>;
};

const ProfileForm = ({ email, name, updateUserInfo }: ProfileFormProps) => {
  const form = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      email: email ?? "",
      name: name ?? "",
    },
  });

  const onSubmit = async ({ email, name }: z.infer<typeof ProfileSchema>) => {
    await updateUserInfo(name);
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6 max-w-sm"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          disabled={form.formState.isLoading}
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Username</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          disabled
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Email</FormLabel>
              <FormControl>
                <Input placeholder="john@abc.com" {...field} type="email" />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="secondary"
          className="self-start font-medium"
        >
          {form.formState.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save User Settings"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;
