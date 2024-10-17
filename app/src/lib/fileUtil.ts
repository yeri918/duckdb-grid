import * as XLSX from "xlsx";
import db from "../duckDB";

/**
 * Removes all characters from a string except for underscores, alphabets, and numbers.
 *
 * @param {string} input - The input string to clean.
 * @returns {string} - The cleaned string.
 */
export function cleanString(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]/g, "");
}

export async function createTable(registeredName: string, file: File) {
  await db.registerFileHandle(registeredName, file, 2, true);
}

/**
 * Converts data types in a record of arrays.
 * If all values in a column are numeric, they are converted to numbers.
 * This is necessary for csv files.
 *
 * @param {Record<string, any[]>} data - The data to convert.
 * @returns {Record<string, any[]>} - The converted data.
 */
export function convertDataTypes(
  data: Record<string, any[]>,
): Record<string, any[]> {
  const convertedData = Object.keys(data).reduce(
    (acc, key) => {
      const columnData = data[key];
      // stop checking if at least one value is non-numeric with some()
      const isNonNumeric = columnData.some((value) => {
        const stringValue = value === undefined ? "0" : value;
        return isNaN(parseFloat(stringValue)) || !isFinite(stringValue);
      });
      acc[key] = !isNonNumeric ? columnData.map(Number) : columnData;
      return acc;
    },
    // eslint-disable-next-line
    {} as Record<string, any[]>,
  );
  return convertedData;
}

/**
 * Loads a CSV file and parses its content into a record of arrays.
 * The returned data is in this format: {ColumnName: [Array of values], ...}
 *
 * @param {File} file - The CSV file to load.
 * @returns {Promise<Record<string, any[]>>} - A promise that resolves to the parsed data.
 */
export function loadCSVFile(file: File): Promise<Record<string, any[]>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result;
      if (fileContent) {
        const textContent = new TextDecoder().decode(
          fileContent as ArrayBuffer,
        );
        // Currently only for csv file
        const rows = textContent.split("\n").map((row) => row.split(","));
        const columns = rows[0];

        const data = columns.reduce(
          (acc, col, index) => {
            col = cleanString(col);
            acc[col] = rows.slice(1).map((row) => row[index]);
            return acc;
          },
          // eslint-disable-next-line
          {} as Record<string, any[]>,
        );
        // Convert data to Arrow Table
        resolve(data);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Loads an XLSX file and parses its content into a record of arrays.
 * The returned data is in this format: {ColumnName: [Array of values], ...}
 *
 * @param {File} file - The XLSX file to load.
 * @returns {Promise<Record<string, any[]>>} - A promise that resolves to the parsed data.
 */
export function loadXLSXFile(file: File): Promise<Record<string, any[]>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result;
      if (fileContent) {
        const data = new Uint8Array(fileContent as ArrayBuffer);

        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0]; // takes the first sheet
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        var columns = jsonData[0] as string[];
        columns = columns.map((col) => cleanString(col));

        const rows = jsonData.slice(1);

        const parsedData = columns.reduce(
          (acc, col, index) => {
            acc[col] = (rows as any[][]).map((row) => row[index]);
            return acc;
          },
          // eslint-disable-next-line
          {} as Record<string, any[]>,
        );
        resolve(parsedData);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function loadParquet(file: File, tableName: string) {
  createTable("local.parquet", file);
}
