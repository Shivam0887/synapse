"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { LIMIT } from "@/lib/constant";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLogs } from "./_actions/log-action";

const LogPage = () => {
  const [logs, setLogs] = useState<
    { status: boolean; action: string; message: string; createdAt: string }[]
  >([]);
  const [pageNum, setPageNum] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const response = await getLogs(pageNum);
      if (response) {
        const result = JSON.parse(response);
        if (result.success) {
          if (result.data.length === 0) setHasMore(false);
          else setHasMore(result.data[0].logs.length > LIMIT);

          const { logs } = result.data[0];

          setLogs((prev) => [...prev, ...logs]);
        } else {
          console.log(result.error);
          toast.error(result.error);
        }
      }
      setIsLoading(false);
    })();
  }, [pageNum]);

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="text-4xl sticky top-0 z-10 py-6 pl-10 backdrop-blur-lg flex items-center border-b">
        Logs
      </div>
      <div className="pt-10 md:pr-10 pr-2 md:pl-20 pl-4 grid grid-cols-[15%_15%_50%_20%] gap-2">
        <span className="text-[#7540A9] font-medium text-lg">Status</span>
        <span className="text-[#7540A9] font-medium text-lg">Action</span>
        <span className="text-[#7540A9] font-medium text-lg">Message</span>
        <span className="text-[#7540A9] font-medium text-lg">Time</span>
      </div>
      <div className="h-[60vh] overflow-scroll">
        <div className="md:pr-10 pr-2 md:pl-20 pl-4 grid grid-cols-[15%_15%_50%_20%] content-start gap-2 ">
          {logs.map(({ action, createdAt, message, status }, index) => (
            <React.Fragment key={createdAt}>
              <span className={status ? "text-emerald-500" : "text-red-500"}>
                {status ? "success" : "failed"}
              </span>
              <span>{action}</span>
              <span className="line-clamp-1" title={message}>
                {message}
              </span>
              <span>{format(createdAt, "do MMM yy hh:mm:ss aaa")}</span>
            </React.Fragment>
          ))}
        </div>
        {hasMore && (
          <div className="mt-6 flex flex-col gap-2 items-center justify-center">
            <Button size="sm" onClick={() => setPageNum((prev) => prev + 1)}>
              load more
            </Button>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPage;
