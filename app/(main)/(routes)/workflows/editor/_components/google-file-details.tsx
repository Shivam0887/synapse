import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { onAddTemplate } from "@/lib/editor-utils";
import { NodeType } from "@/lib/types";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import React from "react";

type Props = {
  nodeConnection: ConnectionProviderProps;
  nodeType: NodeType;
  googleFile: any;
};
const isGoogleFileNotEmpty = (file: any): boolean => {
  return Object.keys(file).length > 0 && file.kind !== "";
};

const GoogleFileDetails = ({ googleFile, nodeConnection, nodeType }: Props) => {
  if (!isGoogleFileNotEmpty(googleFile)) {
    return null;
  }

  const details = ["kind", "name", "mimeType"];
  if (nodeType === "googleNode") {
    details.push("id");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          {details.map((detail) => (
            <div
              key={detail}
              onClick={() =>
                onAddTemplate(nodeConnection, nodeType, googleFile[detail])
              }
              className="flex cursor-pointer gap-2 rounded-full bg-white px-3 py-1 text-gray-500"
            >
              {detail}
              <CardDescription className="text-black">
                {detail}: {googleFile[detail]}
              </CardDescription>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleFileDetails;
