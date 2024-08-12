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
  } else if ( groupKeys.length > 0 && rowGroupCols.length === groupKeys.length ) { // Fully Opened
    sortModel.forEach((key) => {
      eligSortParts.push(`${key.colId} ${key.sort}`)
    });
  } else {
    // Handle Group By Case.
    let rowGroupColIds = rowGroupCols.map((col) => col.id);
    let valueColIds = params.request?.valueCols?.map((col) => col.id);
    let allCols = rowGroupColIds?.concat(valueColIds);

    let intersectCols = sortModel?.filter((value) =>
      allCols.includes(value.colId),
    );

    intersectCols.forEach((key) => {
      let colId = key.colId;
      if (colId === "Auto-Grid-Column") {
        let autoGroupOrder = rowGroupColIds
          .map((colId) => {
            return colId + " " + key.sort;
          })
          .join(",");
        eligSortParts.push(autoGroupOrder);
      } else {
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
