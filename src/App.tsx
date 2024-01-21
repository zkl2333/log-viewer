import { useState } from "react";
import XtermLog from "./components/XtermLog";
import "./App.css";

const App = () => {
  const [fontSize, setFontSize] = useState(12);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          padding: 10,
          fontSize: 12,
        }}
      >
        <div>
          字体大小：
          <button onClick={() => setFontSize((prev) => prev - 1)}>-</button>
          <span>{fontSize}</span>
          <button onClick={() => setFontSize((prev) => prev + 1)}>+</button>
        </div>
      </div>
      <div
        style={{
          flex: 1,
        }}
      >
        <XtermLog fontSize={fontSize} />
      </div>
    </div>
  );
};

export default App;
