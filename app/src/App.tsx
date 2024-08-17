import { useState } from "react";
import "./App.css";
import StdAgGrid from "./components/grid/stdGrid";
import InitUserTable, {
  Schema,
  InitParquetTable,
  InitS3ParquetTable,
} from "./components/table/initTable";





function App() {
  const [count, setCount] = useState(0);

  /* 
    README: Choose the table you want to initialize
  */
  // const table = InitUserTable();
  const parquetTable = InitParquetTable("./bankdataset.parquet", );
  // const s3ParquetTable = InitS3ParquetTable();

  /* 
    README: Choose the table you want to initialize
  */
  let schema: Schema = {
      columns: {
        Domain: "domain",
        Date: "date",
        Location: "today_location",
        Value: "today_daily_value",
        Transaction_count: "today_daily_transaction_count",
      },
      dateColumn: "Date"
    }



  
  return (
    <div className="app-container">
      <h1 className="app-title">Standard Grid</h1>
      <div className="grid-container">
        <StdAgGrid columnDataType={[]} />
      </div>
    </div>
  );
}

export default App;
