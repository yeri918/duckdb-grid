/**
 * Loads a CSV file and creates a table with the specified name.
 *
 * @param file - The CSV file to be loaded.
 * @param tableName - The name of the table to be created.
 * @returns A promise that resolves when the file is registered and the table is created.
 */
import registerFile, { createTable } from "./createTable";

export async function loadCSV(file: File, tableName: string) {
  await registerFile(file, "local.csv");
  await createTable("local.csv", tableName);
}

export default loadCSV;
