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

const duckGridDataSource = (
  database: AsyncDuckDB,
  source: string,
  tableName: string,
): IServerSideDatasource => {
  const getRows = async (params: IServerSideGetRowsParams) => {
    console.log("Requesting rows", params.request);

    const select = await buildSelect(database, params, tableName);
    const groupby = await buildGroupBy(database, params, tableName);
    let where = await buildWhere(database, params, tableName);
    const orderBy = await buildOrderBy(database, params, tableName);
    const limit = await buildLimit(database, params, tableName);

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

    let advancedSql = sql;
    if (params.context?.advancedFilter) {
      let advancedWhere = where;
      if (where === "") {
        advancedWhere += ` WHERE (${params.context.advancedFilter})`;
      } else {
        advancedWhere += ` AND (${params.context.advancedFilter})`;
      }
      // Construct the SQL query
      advancedSql = `
        WITH SOURCE AS (${source}),
        FILTERED AS (
            SELECT * FROM SOURCE
            ${advancedWhere}
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
    }
    console.log("advancedSql", advancedSql);

    // Make a DuckDB connection
    const connection = await database.connect();
    // Execute the query and convert the result to an array of objects
    try {
      // Timed Function
      try {
        // Try executing the query with the advanced filter
        console.log("Trying query with advanced filter:", advancedSql);
        const result = await connection.query(advancedSql);
        const promises = result.toArray();
        const rowData = await Promise.all(promises); // Wait for all promises to resolve
        params.success({ rowData });
        return result;
      } catch (error) {
        console.warn("Query with advanced filter failed:", error);
        const result = await connection.query(sql);
        const promises = result.toArray();
        const rowData = await Promise.all(promises); // Wait for all promises to resolve
        params.success({ rowData });
      }
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
