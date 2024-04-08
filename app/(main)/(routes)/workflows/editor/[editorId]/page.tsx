import { ConnectionsProvider } from "@/providers/connections-provider";
import EditorProvider from "@/providers/editor-provider";
import Editor from "../_components/editor";

type Props = {
  params: string;
};

const Page = ({ params }: Props) => {
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
