import { IServerSideGetRowsRequest } from "ag-grid-community";

export function isPivotQueryRequest(request: IServerSideGetRowsRequest) {
  console.log("isPivotQueryRequest", request);
  return true;
}
