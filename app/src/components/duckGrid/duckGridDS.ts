// datasource.ts
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";

import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import buildSelect from "./sql_builder/select";
import buildGroupBy from "./sql_builder/groupby";
import buildOrderBy from "./sql_builder/orderby";

const duckGridDataSource = (
  database: AsyncDuckDB,
  source: string
): IServerSideDatasource => {
  // 'getRows' and 'destroy' are properties of IServerSideDatasource
  // Reference: https://www.ag-grid.com/javascript-data-grid/server-side-model-datasource/
  return {
    getRows: async (params: IServerSideGetRowsParams) => {
      console.log("Requesting rows", params.request);
      console.log("Row groups", params.request?.rowGroupCols); // Row groups
      console.log("Agg values", params.request?.valueCols); // Aggregated values
      console.log("Sort by", params.request?.sortModel); // Sort model
      console.log("Column Defs", params.api.getGridOption("columnDefs"));

      const [aggFuncs, select] = await buildSelect(database, params);
      const groupby = await buildGroupBy(database, params);
      const orderBy = await buildOrderBy(database, params);

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
            SELECT ${select} FROM GROUPFILTERED ${groupby}
        )
        SELECT * FROM QUERY ${orderBy}
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

export default duckGridDataSource;
