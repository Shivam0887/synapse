import React from "react";
import { CustomNodeTypes } from "./types";

export const onDrapStart = (
  e: React.DragEvent<HTMLDivElement>,
  nodeType: CustomNodeTypes
) => {
  e.dataTransfer.setData("application/reactflow", nodeType);
  e.dataTransfer.effectAllowed = "move";
};
