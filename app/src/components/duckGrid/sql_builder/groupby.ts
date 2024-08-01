import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const buildGroupBy = async (
  database: AsyncDuckDB,
  params: IServerSideGetRowsParams,
) => {
  const isGrouped = params.request?.rowGroupCols.length > 0;
  const isFullyOpened =
    params.request?.groupKeys.length > 0 &&
    params.request?.groupKeys.length === params.request?.rowGroupCols.length;
  if (!isGrouped || isFullyOpened) {
    return "";
  }
  const groupByKeys = params.request?.rowGroupCols
    .map((key) => key.field)
    .join(",");
  return `GROUP BY ${groupByKeys}`;
};

export default buildGroupBy;
