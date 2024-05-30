import { CustomNodeTypes } from "@/lib/types";
import { CircuitBoard, HardDrive } from "lucide-react";
import { SiNotion, SiDiscord } from "react-icons/si";
import { FiSlack } from "react-icons/fi";

type CustomNodeIconProps = {
  type: CustomNodeTypes;
};

const CustomNodeIcon = ({ type }: CustomNodeIconProps) => {
  switch (type) {
    case "AI":
      return <CircuitBoard className="flex-shrink-0" size={30} />;
    case "Slack":
      return <FiSlack className="flex-shrink-0" size={30} />;
    case "Google Drive":
      return <HardDrive className="flex-shrink-0" size={30} />;
    case "Notion":
      return <SiNotion className="flex-shrink-0" size={30} />;
    default:
      return <SiDiscord className="flex-shrink-0" size={30} />;
  }
};

export default CustomNodeIcon;
