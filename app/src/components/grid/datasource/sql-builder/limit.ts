// limit.ts

import { IServerSideGetRowsParams } from "ag-grid-community";

const buildLimit = async (params: IServerSideGetRowsParams) => {
  const startRow =
    params.request?.startRow !== undefined ? params.request.startRow : 0;
  const endRow =
    params.request?.endRow !== undefined ? params.request.endRow : 100;
  const pageSize = endRow - startRow;
  return " LIMIT " + (pageSize + 1) + " OFFSET " + startRow;
};

export default buildLimit;
