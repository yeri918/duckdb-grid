// serverSideDatasource.ts
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";

import Papa from "papaparse";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const createServerSideDatasource = (
  database: AsyncDuckDB,
  source: string
): IServerSideDatasource => {
  console.log("source", source);

  return {
    getRows: async (params: IServerSideGetRowsParams) => {
      console.log("Requesting rows", params.request);
      try {
        const data = fetchData();
        const { rows, lastRow } = await data;
        params.success({ rowData: rows });
      } catch (error) {
        params.fail();
      }
    },
  };
};

interface RowData {
  [key: string]: string | number;
}

async function fetchData() {
  const response = await fetch("/bankdataset.csv");
  if (!response.ok) {
    throw new Error("Failed to fetch the CSV file.");
  }
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get the reader from the response body.");
  }
  const result = await reader.read(); // raw array
  const decoder = new TextDecoder("utf-8");
  const csv = decoder.decode(result.value); // the csv text
  const results = Papa.parse(csv, {
    header: true,
    delimiter: ",",
    transform: (value, header) => {
      if (
        header === "Value" ||
        header === "Transaction_count" ||
        header === "rn"
      ) {
        return parseFloat(value);
      }
      return value;
    },
  }); // object with { data, errors, meta }

  const rows = results.data as RowData[]; // array of objects
  const lastRow = rows.length;
  return { rows, lastRow };
}

export default createServerSideDatasource;
