import db from "../../duckDB";

export default async function registerFile(file: File, registeredName: string) {
  // Registers a file with the given name and creates a table with the given name.

  await db.registerFileHandle(registeredName, file, 2, true);
}

export async function createTable(registeredName: string, tableName: string) {
  const c = await db.connect();
  await c.query(`
        CREATE OR REPLACE TABLE ${tableName} AS
        SELECT * FROM '${registeredName}'
        `);
  await c.close();
}
