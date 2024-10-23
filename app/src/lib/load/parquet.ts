/**
 * Loads a Parquet file and creates a corresponding table in the database.
 *
 * @param file - The Parquet file to be loaded.
 * @param tableName - The name of the table to be created in the database.
 * @returns A promise that resolves when the file has been registered and the table has been created.
 */
import registerFile, { createTable } from "./createTable";

export async function loadParquet(file: File, tableName: string) {
  await registerFile(file, "local.parquet");
  await createTable("local.parquet", tableName);
}

export default loadParquet;
