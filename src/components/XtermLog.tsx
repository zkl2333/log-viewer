import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { CanvasAddon } from "xterm-addon-canvas";
import { WebglAddon } from "xterm-addon-webgl";
import { processAndHighlightLog, throttle } from "../utils";
import "xterm/css/xterm.css";
import { LogLoader } from "../LogLoader";

const crearTerminal = ({ fontSize, renderType }: { fontSize: number; renderType: string }) => {
  const xterm = new Terminal({
    fontSize,
    lineHeight: 1.2,
    convertEol: true,
    disableStdin: false,
    scrollback: 1000000,
  });
  const fitAddon = new FitAddon();
  const canvasAddon = new CanvasAddon();
  const webglAddon = new WebglAddon();
  const webLinksAddon = new WebLinksAddon();

  // renderType === "HTML" && xterm.loadAddon(fitAddon);
  renderType === "Canvas" && xterm.loadAddon(canvasAddon);
  renderType === "WebGL" && xterm.loadAddon(webglAddon);

  xterm.loadAddon(fitAddon);
  // xterm.loadAddon(canvasAddon);
  // xterm.loadAddon(webglAddon);
  xterm.loadAddon(webLinksAddon);

  const throttledFit = throttle(() => {
    console.log("throttledFit");
    try {
      fitAddon.fit();
    } catch (err) {
      console.error(err);
    }
  }, 300);

  return { xterm, throttledFit };
};

function XtermLog({ fontSize, renderType }: { fontSize: number; renderType: string }) {
  const terminalParentRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef(
    crearTerminal({
      fontSize,
      renderType,
    })
  );
  const logBufferRef = useRef("");
  const logLoaderRef = useRef(
    new LogLoader({
      logUrl: "./robot.log",
      chunkSize: 1024 * 2,
      pollingInterval: 1000,
      onNewLogChunk: (chunk) => {
        const data = processAndHighlightLog(chunk);
        terminalRef.current?.xterm.write(data);
        logBufferRef.current += data;
      },
    })
  );

  useEffect(() => {
    if (terminalRef.current?.xterm) {
      terminalRef.current.xterm.options.fontSize = fontSize;
      terminalRef.current.throttledFit();
    }
  }, [fontSize]);

  useEffect(() => {
    if (terminalRef.current?.xterm && terminalParentRef.current) {
      terminalRef.current = crearTerminal({
        fontSize,
        renderType,
      });
      terminalParentRef.current.innerHTML = "";
      terminalRef.current.xterm.open(terminalParentRef.current);
      terminalRef.current.xterm.write(logBufferRef.current);
      terminalRef.current.throttledFit();
    }
  }, [renderType]);

  useEffect(() => {
    let xterm_resize_ob: ResizeObserver;
    logLoaderRef.current.startPolling();

    if (terminalParentRef.current) {
      if (!terminalRef.current?.xterm.element) {
        terminalRef.current?.xterm.open(terminalParentRef.current);
      }
      xterm_resize_ob = new ResizeObserver(function () {
        terminalRef.current.throttledFit();
      });

      // 开始观察调整大小
      xterm_resize_ob.observe(terminalParentRef.current);
      terminalRef.current.throttledFit();
    }

    return () => {
      xterm_resize_ob?.disconnect();
      logLoaderRef.current.stopPolling();
    };
  }, []);

  return (
    <div
      ref={terminalParentRef}
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
      }}
    />
  );
}

export default XtermLog;
