import { CustomNodeType, CustomNodeTypes } from "@/lib/types";
import { useNodeConnections } from "@/providers/connections-provider";
import { useEditor } from "@/providers/editor-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CustomNodeDefaultValues } from "@/lib/constant";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { onDrapStart } from "@/lib/editor-utils";
import CustomNodeIcon from "./custom-node-icon";

type EditorSidebarProps = {
  nodes: CustomNodeType[];
};

const EditorSidebar = ({ nodes }: EditorSidebarProps) => {
  const { state } = useEditor();
  const { nodeConnection } = useNodeConnections();

  return (
    <aside>
      <Tabs defaultValue="actions" className="h-screen overflow-y-scroll">
        <TabsList className="bg-transparent">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent value="actions" className="flex flex-col gap-4 p-4 mb-40">
          {Object.entries(CustomNodeDefaultValues)
            .filter(
              ([_, { type }]) =>
                (!nodes.length && type === "Trigger") ||
                (nodes.length && type === "Action")
            )
            .map(([key, { description }]) => (
              <Card
                key={key}
                draggable
                className="w-full cursor-grab border-black dark:border-neutral-700 dark:bg-neutral-900"
                onDragStart={(e) => onDrapStart(e, key as CustomNodeTypes)}
              >
                <CardHeader className="flex flex-row gap-4 p-4 items-center">
                  <div>
                    <CustomNodeIcon type={key as CustomNodeTypes} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{key}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>
        <TabsContent value="settings" className="-mt-6">
          <div className="px-2 py-4 text-center text-xl font-bold">
            {state.editor.selectedNode.data.title}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default EditorSidebar;
