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

  const loadedColumns = await c.query(`Describe ${tableName}`);
  const result = loadedColumns.toArray().map((row) => row.toJSON());
  console.log("leudom describe", result);

  await result.forEach((column) => {
    if (column.column_type === "DATE") {
      c.query(`
          -- https://duckdb.org/docs/sql/statements/alter_table.html#examples
          ALTER TABLE ${tableName} ALTER ${column.column_name} 
          SET DATA TYPE VARCHAR USING strftime(${column.column_name}, '%Y-%m-%d');
        `);
      console.log("leudom describe alter", column);
    }
  });

  await c.close();
}
