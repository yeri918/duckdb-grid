// ag-grid
import {
  GridPreDestroyedEvent,
  GridApi,
  GridState,
  ColumnState,
} from "ag-grid-community";

// table Folder
import db from "../../../duckDB";

export async function initStateTable() {
  const connection = await db.connect();
  const query = `
    CREATE TABLE IF NOT EXISTS grid_states_test (
      table_name VARCHAR,
      userSaved VARCHAR,  -- Added for Memory Store (MS) and Memory Recall (MV)
      state VARCHAR,
      columnState VARCHAR,
      PRIMARY KEY (table_name, userSaved)
    );
  `;
  await connection.query(query);
  await connection.close();
}

export function fetchPreviousState(tableName: string, userSaved: string) {
  return new Promise((resolve, reject) => {
    db.connect().then(async (connection) => {
      try {
        const query = `
        SELECT table_name, state, columnState FROM grid_states_test
        WHERE table_name = '${tableName}'
          AND userSaved = '${userSaved}';
      `;
        const arrowResult = await connection.query(query);
        const result = arrowResult.toArray().map((row) => row.toJSON());
        console.log("initial state table displayed", result);

        // Tempo Query Execute
        // const query2 = `
        //   SELECT *
        //   FROM ${tableName} limit 5;
        // `;
        // const arrowResult2 = await connection.query(query2);
        // const result2 = arrowResult2.toArray().map((row) => row.toJSON());
        // console.log("leudom temp results", result2);

        await connection.close();
        resolve(result);
      } catch {
        await connection.close();
        reject();
      }
    });
  });
}

export function saveState(
  gridApi: GridApi | null,
  tableName: string,
  userSaved: string,
) {
  if (gridApi) {
    const state = gridApi.getState();
    const columnState = gridApi.getColumnState();
    db.connect().then(async (connection) => {
      const stateString = JSON.stringify(state);
      const columnStateString = JSON.stringify(columnState);
      const query = `
      INSERT INTO grid_states_test
      VALUES ('${tableName}', '${userSaved}', '${stateString}', '${columnStateString}')
      ON CONFLICT (table_name, userSaved) DO UPDATE SET state = EXCLUDED.state, columnState = EXCLUDED.columnState;
    `;
      await connection.query(query);
      await connection.close();
      console.log("leudom inserted successfully");
    });
  }
}

export async function applySavedState(
  gridApi: GridApi | null,
  tableName: string,
  userSaved: string,
) {
  fetchPreviousState(tableName, userSaved).then(async (result: any) => {
    if (result.length > 0 && gridApi !== null) {
      const gridState = JSON.parse(result[0].state);
      const columnState = JSON.parse(result[0].columnState);
      // Apply column state and wait for it to be applied
      gridApi.applyColumnState({
        state: columnState,
        applyOrder: true,
      });

      // Set State Manually
      // Set Filter Model
      if (gridState.filter && gridState.filter.filterModel) {
        gridApi.setFilterModel(gridState.filter.filterModel);
      }

      return gridState;
    }
  });
}

export default initStateTable;
