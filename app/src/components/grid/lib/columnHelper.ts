import {
  ColumnDataType,
  ColumnDef,
  PrefetchedColumnValues,
} from "../interface/GridInterface";
import { Column, RowClassParams, SetFilter } from "ag-grid-enterprise";
import "../StdGrid.css";
import db from "../../../duckDB";
import {
  ColDef,
  StatusPanelDef,
  GridApi,
  ISetFilterParams,
  SetFilterValuesFuncParams,
} from "@ag-grid-community/core";

export const getColumnSetValues = async (column: string, tableName: string) => {
  const connection = await db.connect();
  const arrowResult = await connection.query(`
        SELECT distinct "${column}" as col 
          FROM ${tableName}
          order by col
    `);

  const result = arrowResult
    .toArray()
    .map((row) => row.toJSON())
    .map((value) => value.col);
  await connection.close();
  return result;
};

export const getColumnDefs = (
  columnDataType: ColumnDataType,
  prefetchedColumnValues: PrefetchedColumnValues,
  gridApi: GridApi,
): ColumnDef[] => {
  const columnDefs: ColumnDef[] = [];
  for (const key in columnDataType) {
    let columnDef: ColumnDef = {
      headerName: key,
      field: key,
      enableRowGroup: true,
      enableValue: true,
      headerClass: "ag-header-cell-label",
      ...(columnDataType[key] === "DOUBLE" ||
      columnDataType[key] === "INTEGER" ||
      columnDataType[key] === "FLOAT"
        ? { aggFunc: "sum" }
        : {}),
      filter:
        columnDataType[key] === "VARCHAR" || columnDataType[key] === "DATE"
          ? "agMultiColumnFilter"
          : "agNumberColumnFilter",
      filterParams:
        columnDataType[key] === "VARCHAR" || columnDataType[key] === "DATE"
          ? {
              filters: [
                {
                  filter: "agTextColumnFilter",
                  display: "subMenu",
                  filterParams: {
                    filterOptions: ["contains", "notContains"],
                  },
                },
                {
                  filter: "agSetColumnFilter",
                  filterParams: {
                    values: prefetchedColumnValues[key] || [], // Empty array when no values are present.
                  },
                },
              ],
            }
          : undefined,
    };

    if (["INTEGER", "DOUBLE", "FLOAT"].includes(columnDataType[key])) {
      columnDef.valueFormatter = (params) => {
        return new Intl.NumberFormat().format(params.value);
      };
      columnDef.cellStyle = { textAlign: "right" };
    }
    columnDefs.push(columnDef);
  }
  return columnDefs;
};

export const getLayeredColumnDefs = (
  columnDataType: ColumnDataType,
  prefetchedColumnValues: PrefetchedColumnValues,
  gridApi: GridApi,
) => {
  const columnDefs = getColumnDefs(
    columnDataType,
    prefetchedColumnValues,
    gridApi,
  );
  const layeredColumnDefs: ColumnDef[] = [];
  let i = 0;

  for (const columnDef of columnDefs) {
    const keys = columnDef.field.split("_");
    columnDef.headerClass = "cell-basic";

    if (keys.length === 1) {
      columnDef.headerClass = "cell-basic";
      layeredColumnDefs.push(columnDef);
      continue;
    }

    // For keys > 1
    const initialColumnDef = columnDef;
    initialColumnDef.headerName = keys[keys.length - 1];
    const nestedColumnDef: ColumnDef = keys
      .slice(0, keys.length - 1)
      .reduceRight((nestedColumn: any, key: string) => {
        i++;
        return {
          headerName: key,
          children: [nestedColumn],
          headerClass: "ag-header-cell-label",
          // headerClass:
          //   i % 4 === 0
          //     ? "cell-red"
          //     : i % 4 === 1
          //     ? "cell-green"
          //     : i % 4 === 2
          //     ? "cell-blue"
          //     : "cell-orange",
        };
      }, initialColumnDef);
    layeredColumnDefs.push(nestedColumnDef);
  }

  return layeredColumnDefs;
};

export const getGroupedColumnDefs = (
  columnDataType: ColumnDataType,
  prefetchedColumnValues: PrefetchedColumnValues,
  gridApi: GridApi,
) => {
  const groupedColumnDefs: ColumnDef[] = [];
  const layeredColumnDefs = getLayeredColumnDefs(
    columnDataType,
    prefetchedColumnValues,
    gridApi,
  );
  const columnDefs = getColumnDefs(
    columnDataType,
    prefetchedColumnValues,
    gridApi,
  );

  // Assuming the length is not large, we will do a triangular search.
  for (let i = 0; i < columnDefs.length; i++) {
    const columnDef = layeredColumnDefs[i];
    if (i === layeredColumnDefs.length - 1) {
      groupedColumnDefs.push(columnDef);
      break;
    }
    if (columnDef.children === undefined) {
      groupedColumnDefs.push(columnDef);
      continue;
    }
    for (let j = i + 1; j < columnDefs.length; j++) {
      const currentDef = columnDef;
      const keys1 = columnDefs[j - 1].field.split("_");
      const keys2 = columnDefs[j].field.split("_");

      let matchingIndex = -1; // Initialize to -1 to indicate no match found
      for (let k = 0; k < Math.min(keys1.length, keys2.length); k++) {
        if (keys1[k] === keys2[k]) {
          matchingIndex = k;
        } else {
          break;
        }
      }

      if (matchingIndex === -1) {
        groupedColumnDefs.push(currentDef);
        i = j - 1;
        break;
      }

      let child1: any = currentDef;
      let child2: any = layeredColumnDefs[j];
      let parent: any = currentDef;
      if (matchingIndex >= 0) {
        // Construct the two children first.
        for (let k = 0; k < matchingIndex + 1; k++) {
          if (k === matchingIndex) {
            parent = child1;
            if (Array.isArray(parent)) {
              parent = parent[parent.length - 1];
            }
          }

          if (Array.isArray(child1)) {
            child1 = child1[child1.length - 1].children;
          } else {
            child1 = child1.children;
          }
          // child1 = child1.children
          // console.log("check child1", child1, Array.isArray(child1))

          if (Array.isArray(child2)) {
            child2 = child2[child2.length - 1].children;
          } else {
            child2 = child2.children;
          }
          // child2 = child2.children
        }
        const combinedChildren = [...child1, child2[0]];
        parent.children = combinedChildren;

        // If we are at the last column, we need to push the parent to the groupedColumnDefs
        if (j === layeredColumnDefs.length - 1) {
          groupedColumnDefs.push(currentDef);
          i = j;
          break;
        }
      }
    }
  }

  return groupedColumnDefs;
};
