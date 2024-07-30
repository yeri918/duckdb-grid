import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const buildGroupBy = async (
  database: AsyncDuckDB,
  params: IServerSideGetRowsParams
) => {
  const isGrouped = params.request?.rowGroupCols.length > 0;
  if (!isGrouped) {
    return "";
  }
  const groupByKeys = params.request?.rowGroupCols
    .map((key) => key.field)
    .join(",");
  return `GROUP BY ${groupByKeys}`;
};

export default buildGroupBy;
