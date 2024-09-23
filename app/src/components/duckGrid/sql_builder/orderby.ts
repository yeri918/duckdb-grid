//
// orderby.ts
// ===========
//
// This script does the order by part of the sql
//

import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
  ResizableStructure,
} from "ag-grid-community";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const buildOrderBy = async (
  database: AsyncDuckDB,
  params: IServerSideGetRowsParams,
  tableName: string,
) => {
  const rowGroupCols = params.request?.rowGroupCols;
  const groupKeys = params.request?.groupKeys;
  let sortModel = params.request?.sortModel;
  let eligSortParts: string[] = [];

  // Handle empty sortModel case.
  if (typeof sortModel === "undefined" || sortModel.length === 0) {
    return "";
  }

  if (typeof rowGroupCols === "undefined" || rowGroupCols.length === 0) {
    // No Group By Case
    sortModel.forEach((key) => {
      eligSortParts.push(`${key.colId} ${key.sort}`);
    });
  } else if (groupKeys.length > 0 && rowGroupCols.length === groupKeys.length) {
    // Fully Opened
    sortModel.forEach((key) => {
      console.log("order check", key.colId);
      // If fully open, we don't have to care the row group columns
      if (key.colId !== "ag-Grid-AutoColumn") {
        eligSortParts.push(`${key.colId} ${key.sort}`);
      }
    });
  } else {
    // Get No RowGroup Numeric Columns
    let rowGroupColIds = rowGroupCols.map((col) => col.id);
    const sql = `
        DESCRIBE ${tableName};
    `;
    const connection = await database.connect();
    const arrowResult = await connection.query(sql);
    const result = arrowResult.toArray().map((row) => row.toJSON());

    await connection.close();
    const numericCols: any[] = result
      .filter((value) =>
        ["INTEGER", "DOUBLE", "FLOAT"].includes(value.column_type),
      )
      .map((value) => value.column_name);
    let sortNonGroupCols = sortModel?.filter(
      (value) =>
        !rowGroupColIds.includes(value.colId) &&
        numericCols.includes(value.colId),
    );

    // Case 1: If ag-Grid-AutoColumn is inside
    // then we sort by the the outermost row group columns.
    // then we ignore all rowGroupColumn
    sortModel?.forEach((key) => {
      let colId = key.colId;
      if (colId === "ag-Grid-AutoColumn") {
        const groupKeyLength = params.request?.groupKeys.length ?? 0;
        const sortGroupKey = rowGroupCols[groupKeyLength]; // We get the next one.
        eligSortParts.push(`${sortGroupKey.id} ${key.sort}`);
      }
      if (sortNonGroupCols?.includes(key)) {
        eligSortParts.push(colId + " " + key.sort);
      }
    });
  }

  if (eligSortParts.length === 0) {
    return "";
  } else {
    return `ORDER BY ${eligSortParts.join(", ")}`;
  }
};

export default buildOrderBy;
