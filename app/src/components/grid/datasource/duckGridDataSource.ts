// datasource.ts
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";

import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import buildSelect from "./sql-builder/select";
import buildGroupBy from "./sql-builder/groupby";
import buildWhere from "./sql-builder/where";
import buildOrderBy from "./sql-builder/orderby";
import buildLimit from "./sql-builder/limit";

const duckGridDataSource = (
  database: AsyncDuckDB,
  source: string,
  tableName: string,
  setAdvancedFilterFlag: React.Dispatch<React.SetStateAction<boolean>>,
): IServerSideDatasource => {
  const getRows = async (params: IServerSideGetRowsParams) => {
    console.log("Requesting rows", params.request);

    const select = await buildSelect(params, tableName);
    const groupby = await buildGroupBy(params);
    const where = await buildWhere(params);
    const orderBy = await buildOrderBy(params, tableName);
    const limit = await buildLimit(params);

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
        setAdvancedFilterFlag(true);
        params.success({ rowData });
        return result;
      } catch (error) {
        console.warn("Query with advanced filter failed:", error);
        const result = await connection.query(sql);
        const promises = result.toArray();
        const rowData = await Promise.all(promises); // Wait for all promises to resolve
        setAdvancedFilterFlag(false);
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
