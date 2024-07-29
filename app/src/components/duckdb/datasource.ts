// datasource.ts
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";

import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { isPivotQueryRequest } from "./datasourceHelper";

const createServerSideDatasource = (
  database: AsyncDuckDB,
  source: string
): IServerSideDatasource => {
  console.log("source", source);

  // 'getRows' and 'destroy' are properties of IServerSideDatasource
  // Reference: https://www.ag-grid.com/javascript-data-grid/server-side-model-datasource/
  return {
    getRows: async (params: IServerSideGetRowsParams) => {
      console.log("Requesting rows", params.request);
      console.log("Row groups", params.request?.rowGroupCols); // Row groups
      console.log("Agg values", params.request?.valueCols); // Aggregated values
      console.log("Sort by", params.request?.sortModel); // Sort model
      console.log("Column Defs", params.api.getGridOption("columnDefs"));
      const columnDefs = params.api.getGridOption("columnDefs");

      // Formulate the sql depending on whether there is any 'GROUP BY' columns
      const groupByKeys = params.request?.rowGroupCols.map((key) => key.field);
      const groupByKeysString =
        groupByKeys && groupByKeys.length > 0
          ? `GROUP BY ${groupByKeys.join(", ")}`
          : "";
      const aggCols =
        params.request?.valueCols.length > 0
          ? params.request?.valueCols.map(
              (key) => `${key.aggFunc}(${key.field}) AS ${key.field}`
            )
          : [""];
      const selectCols =
        groupByKeys && groupByKeys.length > 0
          ? `${groupByKeys.join(", ")}, ${aggCols.join(",")}`
          : "*";

      // Construct the SQL query
      const sql = `
        WITH SOURCE AS (${source}),
        FILTERED AS (
            SELECT * FROM SOURCE
        ),
        GROUPFILTERED AS (
            SELECT * FROM FILTERED
        ),
        QUERY AS (
            SELECT ${selectCols} FROM GROUPFILTERED ${groupByKeysString}
        )
        SELECT * FROM QUERY
    `;
      console.log("sql", sql);

      // Make a DuckDB connection
      const connection = await database.connect();

      // Execute the query and convert the result to an array of objects
      try {
        const result = await connection.query(sql);
        const rowData = result.toArray();
        params.success({ rowData });
      } finally {
        await connection.close();
      }
    },
    destroy: () => {
      console.log("Destroying datasource");
    },
  };
};

export default createServerSideDatasource;
