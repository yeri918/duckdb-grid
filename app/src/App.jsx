import { useState } from "react";
import "./App.css";
import StdAgGrid from "./components/grid/stdGrid.tsx";
import InitUserTable, {
  InitParquetTable,
  InitS3ParquetTable,
} from "./components/table/initTable";

function App() {
  const [count, setCount] = useState(0);
  const table = InitUserTable();
  const parquetTable = InitParquetTable();
  // const s3ParquetTable = InitS3ParquetTable();

  return (
    <div className="app-container">
      <h1 className="app-title">Standard Grid</h1>
      <div className="grid-container">
        <StdAgGrid />
      </div>
    </div>
  );
}

export default App;
