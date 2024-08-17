import { useEffect, useState } from "react";
import "./App.css";
import StdAgGrid from "./components/grid/stdGrid";
import InitUserTable, {
  columnDataType,
  InitParquetTable,
  InitS3ParquetTable,
} from "./components/table/initTable";

/* 
  ------------START OF USER EDITABLE AREA------------
  Go through the README below to setup the table.
*/

function App() {
  const [ready, setReady] = useState<boolean>(false);

  /* 
    README: Choose the table you want to initialize
  */
  // const table = InitUserTable();
  const parquetTable = InitParquetTable("./bankdataset.parquet", );
  // const s3ParquetTable = InitS3ParquetTable();

  /* 
    README: Choose the table you want to initialize
  */
  const userColumns: columnDataType = {
    domain: "VARCHAR",
    date: "DATE",
    today_location: "VARCHAR",
    today_daily_value: "DOUBLE",
    today_daily_transaction_count: "DOUBLE",
    row_number: "INTEGER",
  }

  /* 
    ------------END OF USER EDITABLE AREA------------
  */
  useEffect(() => {
    setReady(true);
  }, [userColumns]); 

  return (
    <div className="app-container">
      <h1 className="app-title">Standard Grid</h1>
      <div className="grid-container">
        {ready ? (
          <StdAgGrid columnDataType={userColumns} />
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}

export default App;
