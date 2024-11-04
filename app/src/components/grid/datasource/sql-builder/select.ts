// select.ts

import { IServerSideGetRowsParams } from "ag-grid-community";

import db from "../../../../duckDB";

const buildSelect = async (
  params: IServerSideGetRowsParams,
  tableName: string,
) => {
  const isGrouped = params.request?.rowGroupCols.length > 0;
  const isFullyOpened =
    params.request?.groupKeys.length === params.request?.rowGroupCols.length;

  // If no grouping, select all columns
  if (!isGrouped || isFullyOpened) {
    return "*";
  }

  const groupkeyLength = params.request?.groupKeys.length;
  const groupByKeys = params.request?.rowGroupCols
    .map((key) => key.field)
    .slice(groupkeyLength, groupkeyLength + 1)
    .join(",");

  // Get all numeric columns
  const sql = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE 
        table_name = '${tableName}'
        AND data_type IN ('INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT', 'DOUBLE', 'DECIMAL');
`;

  // If no grouping, select all columns
  if (!isGrouped) {
    return "*";
  } else {
    // TODO: separate function to make the connection
    const connection = await db.connect();
    const result = await connection.query(sql);
    await connection.close();

    const numericCols = JSON.parse(JSON.stringify(result.toArray())).map(
      (col: { column_name: string }) => col.column_name,
    );

    // Pick up the aggfunc specified by users.
    const valueCols = params.request?.valueCols;
    const aggDict =
      valueCols.length > 0
        ? valueCols.reduce(
            (acc, col) => {
              if (col.field != null && col.aggFunc != null) {
                acc[col.field] = col.aggFunc;
              }
              return acc;
            },
            {} as { [key: string]: string },
          )
        : {};
    // By default, set the aggfunc to sum if not specified
    if (numericCols.length > 0) {
      for (const key of numericCols) {
        if (!Object.keys(aggDict).includes(key)) {
          aggDict[key] = "sum";
        }
      }
    }
    const aggCols = Object.entries(aggDict).map(
      ([col, agg]) => `${agg}("${col}") AS "${col}"`,
    );

    return `${groupByKeys}, ${aggCols.join(", ")}`;
  }
};

export default buildSelect;
