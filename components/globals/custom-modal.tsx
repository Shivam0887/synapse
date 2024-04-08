import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { useModal } from "@/providers/modal-provider";
import { Button } from "../ui/button";

type CustomModalProps = {
  title: string;
  subHeading: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const CustomModal = ({
  children,
  subHeading,
  title,
  defaultOpen,
}: CustomModalProps) => {
  const { isOpen, setClose } = useModal();

  return (
    <Drawer open={isOpen} onClose={setClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center">{title}</DrawerTitle>
          <DrawerDescription className="text-center flex flex-col items-center gap-4 h-96 overflow-scroll">
            {subHeading}
            {children}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex flex-col gap-4 bg-background border-t-[1px] border-t-muted">
          <DrawerClose>
            <Button variant="ghost" className="w-full" onClick={setClose}>
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CustomModal;
