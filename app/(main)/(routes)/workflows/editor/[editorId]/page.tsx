import { ConnectionsProvider } from "@/providers/connections-provider";
import EditorProvider from "@/providers/editor-provider";
import Editor from "../_components/editor";
import { currentUser } from "@clerk/nextjs/server";
import { User } from "@/models/user-model";
import ConnectToDB from "@/lib/connectToDB";

const Page = async ({ params }: { params: { editorId: string } }) => {
  const { editorId: workflowId } = params;

  ConnectToDB();
  const user = await currentUser();
  await User.findOneAndUpdate(
    { userId: user?.id },
    {
      $set: {
        currentWorkflowId: workflowId,
      },
    }
  );

  return (
    <div className="h-full">
      <EditorProvider>
        <ConnectionsProvider>
          <Editor />
        </ConnectionsProvider>
      </EditorProvider>
    </div>
  );
};

export default Page;
