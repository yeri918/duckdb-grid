import { useEffect, useState } from "react";
import "./App.css";
import StdAgGrid from "./components/grid/stdGrid";
import { ColumnDataType } from "./components/grid/gridTypes";
import InitUserTable, {
  InitParquetTable,
  InitS3ParquetTable,
} from "./components/table/initTable";

/* 
  ------------START OF USER EDITABLE AREA------------
  Go through the README below to setup the table.
*/

function App() {
  const [ready, setReady] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number>(0);

  /* 
    README: Choose the table you want to initialize
  */
  const userColumns: ColumnDataType = {
    domain: "VARCHAR",
    date: "DATE",
    today_location: "VARCHAR",
    today_daily_value: "DOUBLE",
    today_daily_transaction_count: "DOUBLE",
    row_number: "INTEGER",
  }

  /* 
    README: Choose the table you want to initialize
  */
  // const table = InitUserTable();
  const parquetTable = InitParquetTable("./bankdataset.parquet", userColumns);
  // const s3ParquetTable = InitS3ParquetTable();

  /* 
    ------------END OF USER EDITABLE AREA------------
  */
  useEffect(() => {
    setReady(true);
  }, [userColumns]);

  return (
    <div className="app-container" style={{}}>
      <div className="top-right" style={{ position: "absolute", top: "10px", right: "10px" }}>
        <div>Exec: {executionTime.toFixed(2)} ms</div>
      </div>
      <h1 className="app-title">Standard Grid</h1>
      <div className="grid-container">
        {ready ? (
          <StdAgGrid columnDataType={userColumns} setExecutionTime={setExecutionTime} />
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}

export default App;
