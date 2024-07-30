import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const buildSelect = async (
  database: AsyncDuckDB,
  params: IServerSideGetRowsParams
) => {
  const isGrouped = params.request?.rowGroupCols.length > 0;

  // If no grouping, select all columns
  if (!isGrouped) {
    return "*";
  }

  const groupByKeys = params.request?.rowGroupCols
    .map((key) => key.field)
    .join(",");

  // Get all numeric columns
  const sql = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE 
        table_name = 'bankdata'
        AND data_type IN ('INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT', 'DOUBLE', 'DECIMAL');
`;

  // TODO: separate function to make the connection
  const connection = await database.connect();
  const result = await connection.query(sql);
  await connection.close();

  const numericCols = JSON.parse(JSON.stringify(result.toArray())).map(
    (col: { column_name: string }) => col.column_name
  );

  // TODO: change the aggfunc when user specifies it
  const valueCols = params.request?.valueCols;
  if (valueCols) {
    console.log("valueCols", valueCols);
  }
  console.log(numericCols, "numeric");
  const aggCols = numericCols
    .map((col: string) => `SUM(${col}) AS ${col}`)
    .join(", ");

  return `${groupByKeys}, ${aggCols}`;
};

export default buildSelect;
