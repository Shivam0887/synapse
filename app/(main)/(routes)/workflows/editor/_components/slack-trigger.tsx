import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TriggerProps } from "@/lib/types";
import WorkflowLoading from "./workflow-loading";

const SlackTrigger = ({
  loading,
  onSave,
  setTrigger,
  trigger,
  workspaceName,
}: TriggerProps) => {
  return (
    <div className="relative">
      {loading ? (
        <WorkflowLoading />
      ) : (
        <>
          <h3 className="my-2">{workspaceName}</h3>
          <Select onValueChange={setTrigger} defaultValue={trigger}>
            <SelectTrigger className="text-neutral-400">
              <SelectValue placeholder="select trigger" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0" className="cursor-pointer">
                <div className="gap-2 flex flex-col items-start ">
                  <p className="text-sm font-medium line-clamp-1">
                    New Channel
                  </p>
                  <p className="text-xs text-neutral-500 text-start line-clamp-1">
                    Triggers whenever a new #channel is created.
                  </p>
                </div>
              </SelectItem>
              <Separator />
              <SelectItem value="1" className="cursor-pointer">
                <div className="gap-2 flex flex-col items-start">
                  <p className="text-sm font-medium line-clamp-1">New File</p>
                  <p className="text-xs text-neutral-500 text-start line-clamp-1">
                    Triggers when a new file is uploaded to a specific public
                    #channel.
                  </p>
                </div>
              </SelectItem>
              <Separator />
              <SelectItem value="2" className="cursor-pointer">
                <div className="gap-2 flex flex-col items-start">
                  <p className="text-sm font-medium line-clamp-1">
                    New Reaction
                  </p>
                  <p className="text-xs text-neutral-500 text-start line-clamp-1">
                    Triggers when a new Reaction is added to a Message.
                  </p>
                </div>
              </SelectItem>
              <Separator />
              <SelectItem value="3" className="cursor-pointer">
                <div className="gap-2 flex flex-col items-start">
                  <p className="text-sm font-medium line-clamp-1">
                    New Message Posted to Channel
                  </p>
                  <p className="text-xs text-neutral-500 text-start line-clamp-1">
                    Triggers when a new message is posted to a specific #channel
                    you choose.
                  </p>
                </div>
              </SelectItem>
              <Separator />
              <SelectItem value="4" className="cursor-pointer">
                <div className="gap-2 flex flex-col items-start">
                  <p className="text-sm font-medium line-clamp-1">
                    New Message Posted to Private Channel
                  </p>
                  <p className="text-xs text-neutral-500 text-start line-clamp-1">
                    Triggers when a new message is posted to a specific
                    #private-channel.
                  </p>
                </div>
              </SelectItem>
              <Separator />
              <SelectItem value="4" className="cursor-pointer">
                <div className="gap-2 flex flex-col items-start">
                  <p className="text-sm font-medium line-clamp-1">
                    New User Join
                  </p>
                  <p className="text-xs text-neutral-500 text-start line-clamp-1">
                    Triggers when a new user joined a #public-channel or
                    #private-channel.
                  </p>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button className="mt-4" variant="outline" onClick={onSave}>
            save trigger
          </Button>
        </>
      )}
    </div>
  );
};

export default SlackTrigger;
