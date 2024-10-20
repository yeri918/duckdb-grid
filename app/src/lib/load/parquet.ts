import registerFile, { createTable } from "./createTable";
import db from "../../duckDB";

export async function loadParquet(file: File, tableName: string) {
  await registerFile(file, "local.parquet");
  await createTable("local.parquet", tableName);
}

export default loadParquet;
