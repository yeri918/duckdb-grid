// ag-grid
import { GridApi } from "@ag-grid-community/core";
import db from "../../../duckDB";

interface stateResult {
  tableName: string;
  userSaved: string;
  state: string;
  columnState: string;
}

export async function initStateTable() {
  const connection = await db.connect();
  const query = `
    CREATE TABLE IF NOT EXISTS grid_states_test (
      tableName VARCHAR,
      userSaved VARCHAR,  
      state VARCHAR,
      columnState VARCHAR,
      PRIMARY KEY (tableName, userSaved)
    );
  `;
  await connection.query(query);
  await connection.close();
}

export function fetchPreviousState(
  tableName: string,
  userSaved: string,
): Promise<stateResult[]> {
  return new Promise((resolve, reject) => {
    db.connect().then(async (connection) => {
      try {
        const query = `
        SELECT tableName, state, columnState FROM grid_states_test
        WHERE tableName = '${tableName}'
          AND userSaved = '${userSaved}';
      `;
        const arrowResult = await connection.query(query);
        const result = arrowResult
          .toArray()
          .map((row) => row.toJSON()) as stateResult[];

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
      ON CONFLICT (tableName, userSaved) DO UPDATE SET state = EXCLUDED.state, columnState = EXCLUDED.columnState;
    `;
      await connection.query(query);
      await connection.close();
    });
  }
}

export async function applySavedState(
  gridApi: GridApi | null,
  tableName: string,
  userSaved: string,
) {
  fetchPreviousState(tableName, userSaved).then(async (result) => {
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
