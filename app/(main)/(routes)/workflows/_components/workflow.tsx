import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import Link from "next/link";

type WorkflowProps = {
  id: string;
  name: string;
  publish: boolean | null;
  description: string;
};

const Workflow = ({ description, id, name, publish }: WorkflowProps) => {
  return (
    <Card className="flex items-center justify-between w-full">
      <CardHeader className="flex flex-col gap-4">
        <Link href={`/workflows/editor/${id}`}>
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
        </Link>
        <div className="">
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <div className="flex flex-col items-center gap-2 p-4">
        <Label htmlFor="publish" className="text-muted-foreground">
          On
        </Label>
        <Switch id="publish" />
      </div>
    </Card>
  );
};

export default Workflow;
