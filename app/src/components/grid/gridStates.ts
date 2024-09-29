// ag-grid
import { GridPreDestroyedEvent, GridApi } from "ag-grid-community";

// table Folder
import db from "../table/duckDB";

export async function initStateTable() {
  const connection = await db.connect();
  const query = `
    CREATE TABLE IF NOT EXISTS grid_states_test (
      table_name VARCHAR,
      userSaved VARCHAR DEFAULT 'false',  -- Added for Memory Store (MS) and Memory Recall (MV)
      state VARCHAR,
      columnState VARCHAR,
      PRIMARY KEY (table_name, userSaved)
    );
  `;
  await connection.query(query);
  await connection.close();
}

export function fetchPreviousState(tableName: string) {
  return new Promise((resolve) => {
    db.connect().then(async (connection) => {
      const query = `
        SELECT table_name, state, columnState FROM grid_states_test
        WHERE table_name = '${tableName}'
          AND userSaved = 'false';
      `;
      const arrowResult = await connection.query(query);
      const result = arrowResult.toArray().map((row) => row.toJSON());
      console.log("initial state table displayed", result);
      await connection.close();
      resolve(result[0]);
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
  const connection = await db.connect();
  const query = `
      SELECT * FROM grid_states_test
      WHERE table_name = '${tableName}'
        AND userSaved = '${userSaved}';
    `;
  const arrowResult = await connection.query(query);
  const result = arrowResult.toArray().map((row) => row.toJSON());
  await connection.close();

  if (result.length > 0 && gridApi !== null) {
    const gridState = JSON.parse(result[0].state);
    const columnState = JSON.parse(result[0].columnState);
    // Apply column state and wait for it to be applied
    await new Promise<void>((resolve) => {
      gridApi.applyColumnState({
        state: columnState,
        applyOrder: true,
      });
      resolve(console.log("leudom node", gridApi.getRenderedNodes()));
    }).then();
    console.log("leudom gridState", gridState);
    console.log("leudom columnState", columnState);

    // Set State Manually
    // Set Filter Model
    if (gridState.filter && gridState.filter.filterModel) {
      gridApi.setFilterModel(gridState.filter.filterModel);
    }

    // await new Promise<void>((resolve) => {
    //   gridApi.forEachNode((node) => {
    //     if (node.group) {
    //       console.log("leudom node", node.key);
    //       node.setExpanded(true);
    //     }
    //   });
    //   resolve();
    // });

    // Set Row Group Expansion
    // if (
    //   gridState.rowGroupExpansion &&
    //   Array.isArray(gridState.rowGroupExpansion)
    // ) {
    //   gridApi.forEachNode((node) => {
    //     if (gridState.rowGroupExpansion.includes(node.key)) {
    //       node.setExpanded(true);
    //     }
    //   });
    // }
  }
}

export default initStateTable;
