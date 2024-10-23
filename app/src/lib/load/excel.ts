import { tableFromArrays } from "apache-arrow";
import * as XLSX from "xlsx";
import db from "../../duckDB";

/**
 * Removes all characters from a string except for underscores, alphabets, and numbers.
 *
 * @param {string} input - The input string to clean.
 * @returns {string} - The cleaned string.
 */
export function cleanString(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]/g, "");
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

export async function loadExcel(file: File, tableName: string) {
  const data = await loadXLSXFile(file);
  const table = tableFromArrays(data as Record<string, (string | number)[]>);

  const c = await db.connect();
  await c.insertArrowTable(table, {
    name: `${tableName}`,
    create: true,
  });
  const a = c.query(`DESCRIBE ${tableName}`);
  console.log("leudom aa  ", a);
  await c.close();
}

export default loadExcel;
