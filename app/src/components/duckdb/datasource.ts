// serverSideDatasource.ts
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";

import Papa from "papaparse";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const createServerSideDatasource = (
  database: AsyncDuckDB,
  source: string
): IServerSideDatasource => {
  console.log("source", source);

  return {
    getRows: async (params: IServerSideGetRowsParams) => {
      console.log("Requesting rows", params.request);
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
            SELECT * FROM GROUPFILTERED
        )
        
        SELECT * FROM QUERY
    `;

      console.log("sql", sql);

      // Make a DuckDB connection
      const connection = await database.connect();
      try {
        // Execute the query and convert the result to an array of objects
        const result = await connection.query(sql);
        const rowData = result.toArray();
        params.success({ rowData });
      } catch {
        params.fail();
      } finally {
        await connection.close();
      }
    },
  };
};

export default createServerSideDatasource;
