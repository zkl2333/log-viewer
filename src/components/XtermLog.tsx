import { useEffect, useRef } from "react";
import { processAndHighlightLog } from "../utils";
import { LogLoader } from "../LogLoader";
import { Xterm } from "./Xterm/Xterm";

function XtermLog({ fontSize }: { fontSize: number }) {
  const xtermRef = useRef<{
    write: (data: string | Uint8Array) => void;
    clear: () => void;
  }>(null);

  const logBufferRef = useRef("");
  const logLoaderRef = useRef(
    new LogLoader({
      logUrl: "/log-viewer/robot.log",
      chunkSize: 1024 * 10,
      pollingInterval: 1000,
      onNewLogChunk: (chunk) => {
        const data = processAndHighlightLog(chunk);
        xtermRef.current?.write(data);
        logBufferRef.current += data;
      },
    })
  );

  useEffect(() => {
    logLoaderRef.current.startPolling();

    return () => {
      logLoaderRef.current.stopPolling();
    };
  }, []);

  return (
    <Xterm
      ref={xtermRef}
      style={{
        height: "100%",
        width: "100%",
        padding: "0.5rem",
        boxSizing: "border-box",
      }}
      options={{
        fontFamily: "Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace",
        fontSize,
        lineHeight: 1.4,
        convertEol: true,
        disableStdin: true,
        scrollback: 1000000,
      }}
    />
  );
}

export default XtermLog;
