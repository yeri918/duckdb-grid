// Reference: https://www.ag-grid.com/javascript-data-grid/server-side-model-sorting/
//
// This script performs Server-Side Sorting.
// We use the data contained in the sortModel object to perform sorting.
//

import {
    IServerSideDatasource,
    IServerSideGetRowsParams,
  } from "ag-grid-community";
  import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const buildOrderBy = async (
    database: AsyncDuckDB,
    params: IServerSideGetRowsParams
  ) => {

    const sortModel = params.request?.sortModel;

    if (!sortModel) {
        return "";
    }
    
    const orderByKeys = sortModel
        .map((key) => key.colId + " " + key.sort)
        .join(",");


    console.log("Checck1");
    console.log(sortModel);
    console.log(orderByKeys);
    console.log("Checck2");
    console.log(params.request)

    return `ORDER BY ${orderByKeys}`;

  };
  

export default buildOrderBy;

