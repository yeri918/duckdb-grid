
// ag-grid
import { GridPreDestroyedEvent, GridApi } from "ag-grid-community";

// table Folder
import db from "../table/duckDB";

export async function initStateTable() {
  const connection = await db.connect();
  const query = `
    CREATE TABLE IF NOT EXISTS grid_states_test (
      table_name VARCHAR PRIMARY KEY,
      state VARCHAR,
      columnState VARCHAR
    );
  `;
  await connection.query(query);
  await connection.close();
};

export function fetchPreviousState(tableName: string) {
  return new Promise((resolve) => {
    db.connect().then(async (connection) => {
      const query = `
        SELECT table_name, state, columnState FROM grid_states_test
        WHERE table_name = '${tableName}';
      `;
      const arrowResult = await connection.query(query);
      const result = arrowResult.toArray().map((row) => row.toJSON());
      console.log("initial state table displayed", result);
      await connection.close();
      resolve(result[0]);
    });
  });
};

export function saveState(params: GridPreDestroyedEvent, tableName: string) {
  const state = params.api.getState();
  const columnState = params.api.getColumnState();
  db.connect().then(async (connection) => {
    const stateString = JSON.stringify(state);
    const columnStateString = JSON.stringify(columnState);
    const query = `
      INSERT INTO grid_states_test
      VALUES ('${tableName}', '${stateString}', '${columnStateString}')
      ON CONFLICT DO UPDATE SET state = EXCLUDED.state, columnState = EXCLUDED.columnState;
    `;
    await connection.query(query);
    await connection.close();
    console.log("leudom inserted successfully")
  });
};

export async function applySavedState(tableName: string, gridApi: GridApi | null) {
  const connection = await db.connect();
    const query = `
      SELECT * FROM grid_states_test
      WHERE table_name = '${tableName}';
    `;
    const arrowResult = await connection.query(query);
    const result = arrowResult.toArray().map((row) => row.toJSON());
    await connection.close();

    if (result.length > 0 && gridApi !== null) {
      const gridState = JSON.parse(result[0].state);
      const columnState = JSON.parse(result[0].columnState);
      gridApi.applyColumnState({ state: columnState });
      console.log("leudom gridState applied", gridState);
    }
}

export default initStateTable;