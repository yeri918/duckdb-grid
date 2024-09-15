// datasource.ts
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";

import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import buildSelect from "./sql_builder/select";
import buildGroupBy from "./sql_builder/groupby";
import buildWhere from "./sql_builder/where";
import buildOrderBy from "./sql_builder/orderby";
import buildLimit from "./sql_builder/limit";
import { useState } from 'react';


const duckGridDataSource = (
  database: AsyncDuckDB,
  source: string,
): IServerSideDatasource => {

  const getRows = async (params: IServerSideGetRowsParams<any, any> & { columns: any }) => {
    console.log("Requesting rows", params.request);

    const select = await buildSelect(database, params);
    const groupby = await buildGroupBy(database, params);
    const where = await buildWhere(database, params);
    const orderBy = await buildOrderBy(database, params);
    const limit = await buildLimit(database, params);

    // Construct the SQL query
    const sql = `
      WITH SOURCE AS (${source}),
      FILTERED AS (
          SELECT * FROM SOURCE
          ${where}
      ),
      GROUPFILTERED AS (
          SELECT * FROM FILTERED
      ),
      QUERY AS (
          SELECT ${select} FROM GROUPFILTERED ${groupby}
      )
      SELECT * FROM QUERY ${orderBy}
      ${limit};
    `;
    console.log("sql", sql);

    // Make a DuckDB connection
    const connection = await database.connect();

    // Execute the query and convert the result to an array of objects
    try {
      // Timed Function
      const result = await connection.query(sql);
      const promises = result.toArray();
      const rowData = await Promise.all(promises); // Wait for all promises to resolve
      params.success({ rowData });
    } finally {
      await connection.close();

    }
  };

  // 'getRows' and 'destroy' are properties of IServerSideDatasource
  // 'destroy' is being removed because it is not being used
  // Reference: https://www.ag-grid.com/javascript-data-grid/server-side-model-datasource/
  return {
    getRows: getRows,
  };
};

export default duckGridDataSource;
