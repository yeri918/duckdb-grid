// Reference: https://www.ag-grid.com/javascript-data-grid/server-side-model-sorting/
//
// This script performs Server-Side Sorting.
// We use the data contained in the sortModel object to perform sorting.
//

import {
    IServerSideDatasource,
    IServerSideGetRowsParams,
    ResizableStructure,
  } from "ag-grid-community";
  import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const buildOrderBy = async (
  database: AsyncDuckDB,
  params: IServerSideGetRowsParams
) => {

  let sortModel = params.request?.sortModel;
  let rowGroupColIds = params.request?.rowGroupCols?.map((col) => col.id);
  let valueColIds = params.request?.valueCols?.map((col) => col.id);
  let allCols = rowGroupColIds.concat(valueColIds);

  // User might specify a sort keys that are not in the sql query.
  const getEligSortModel = () => {
    let intersectCols = sortModel.filter(value => allCols.includes(value.colId));
    let eligSortModel = sortModel.filter(value => intersectCols.includes(value));
    return eligSortModel;
  }

  let eligSortModel = getEligSortModel();
  console.log("Eligible Sort Model: ", eligSortModel);
  

  if (eligSortModel?.length === 0) {
    return "";
  }

  let orderByKeys = eligSortModel
    .map((key) => {
      let colId = key.colId;
      

      if (colId === "Auto-Grid-Column") {
        let autoGroupOrder = rowGroupColIds
          .map((colId) => {
            return colId + " " + key.sort;
          })
          .join(",")
        return autoGroupOrder;
      }

      return colId + " " + key.sort;
    })
    .filter((key) => key !== null) // Remove null values
    .join(",");

  console.log(orderByKeys);

  return `ORDER BY ${orderByKeys}`;
};
  

export default buildOrderBy;

