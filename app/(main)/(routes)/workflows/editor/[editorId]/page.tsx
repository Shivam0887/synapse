import { ConnectionsProvider } from "@/providers/connections-provider";
import EditorProvider from "@/providers/editor-provider";
import Editor from "../_components/editor";
import { auth } from "@clerk/nextjs/server";
import { User } from "@/models/user.model";
import ConnectToDB from "@/lib/connectToDB";

const Page = async ({ params }: { params: { editorId: string } }) => {
  const { editorId: workflowId } = params;

  await ConnectToDB();
  const { userId } = await auth();
  await User.findOneAndUpdate(
    { userId },
    {
      $set: {
        currentWorkflowId: workflowId,
      },
    }
  );

  return (
    <div className="h-full overflow-hidden">
      <EditorProvider>
        <ConnectionsProvider>
          <Editor />
        </ConnectionsProvider>
      </EditorProvider>
    </div>
  );
};

export default Page;
