import { ColumnDataType, ColumnDef } from './gridTypes';
import { Column, RowClassParams } from "ag-grid-enterprise";
import './style.css';

export const getColumnDefs = (columnDataType: ColumnDataType): ColumnDef[] => {
  const columnDefs: ColumnDef[] = [];
  for (const key in columnDataType) {
    let columnDef: ColumnDef = {
      headerName: key,
      field: key,
      enableRowGroup: true,
      enableValue: true,
      ...(columnDataType[key] === "DOUBLE" || columnDataType[key] === "INTEGER" || columnDataType[key] === "FLOAT" ? { aggFunc: "sum" } : {}),
      filter:
        columnDataType[key] === "VARCHAR" || columnDataType[key] === "DATE" ?
          "agTextColumnFilter" : "agNumberColumnFilter",

    };

    if (["INTEGER", "DOUBLE", "FLAOT"].includes(columnDataType[key])) {
      columnDef.valueFormatter = (params) => {
        return new Intl.NumberFormat().format(params.value);
      };

    }
    columnDefs.push(columnDef);
  }
  return columnDefs;
}

export const getLayeredColumnDefs = (columnDataType: ColumnDataType) => {
  const columnDefs = getColumnDefs(columnDataType);
  const layeredColumnDefs: ColumnDef[] = [];
  let i = 0;

  for (const columnDef of columnDefs) {
    const keys = columnDef.field.split('_');

    if (keys.length === 1) {
      layeredColumnDefs.push(columnDef);
      continue;
    }

    // For keys > 1
    const initialColumnDef = columnDef;
    initialColumnDef.headerName = keys[keys.length - 1];
    const nestedColumnDef: ColumnDef = keys.slice(0, keys.length - 1).reduceRight((nestedColumn: any, key: string) => {
      i++;
      return {
        headerName: key,
        children: [nestedColumn],
        headerClass: i % 4 === 0 ? "cell-red" : i % 4 === 1 ? "cell-green" : i % 4 === 2 ? "cell-blue" : "cell-orange"
      };
    }, initialColumnDef);
    console.log("domm", nestedColumnDef)
    layeredColumnDefs.push(nestedColumnDef);
  }

  return layeredColumnDefs;

}

export const getGroupedColumnDefs = (columnDataType: ColumnDataType) => {
  const groupedColumnDefs: ColumnDef[] = [];
  const layeredColumnDefs = getLayeredColumnDefs(columnDataType);
  const columnDefs = getColumnDefs(columnDataType);

  let i = 0;
  let j = 0;
  let currentCompare: ColumnDef[] | ColumnDef | null = null;
  let nextCompare: ColumnDef[] | ColumnDef | null = null;

  // Assuming the length is not large, we will do a triangular search.
  let k = 0;
  for (let i = 0; i < columnDefs.length; i++) {
    console.log('check startb', i, j, columnDefs.length)
    if (i === layeredColumnDefs.length - 1) {
      const columnDef = layeredColumnDefs[i];
      groupedColumnDefs.push(columnDef);
      console.log('check b')
      break;
    }
    for (let j = i + 1; j < columnDefs.length; j++) {
      console.log('check start', i, j, columnDefs.length)
      const columnDef = layeredColumnDefs[i];
      // console.log('check', i, j, columnDef)
      if (columnDef.children === undefined) {
        groupedColumnDefs.push(columnDef);
        break;
      }

      const currentDef = columnDef;
      const keys1 = columnDefs[i].field.split('_');
      const keys2 = columnDefs[j].field.split('_');

      let matchingIndex = -1; // Initialize to -1 to indicate no match found
      for (let k = 0; k < Math.min(keys1.length, keys2.length); k++) {
        console.log('check detail', keys1[k], keys2[k], k)
        if (keys1[k] === keys2[k]) {
          matchingIndex = k;
        } else {
          break;
        }
      }
      console.log('matching Index', matchingIndex);
      console.log('check', keys1, keys2, i, j, matchingIndex);

      if (matchingIndex === -1) {
        groupedColumnDefs.push(currentDef);
        i = j - 1;
        console.log('check d', i, j)
        break;
      };

      let child1: any = currentDef;
      let child2: any = layeredColumnDefs[j];
      let parent: any = currentDef;
      if (matchingIndex >= 0) {
        // Construct the two children first.
        for (let k = 0; k < matchingIndex + 1; k++) {
          if (k === matchingIndex) {
            parent = child1;
          }
          child1 = child1.children;
          child2 = child2.children;
        }
        const combinedChildren = [...child1, child2[0]];
        parent.children = combinedChildren;
      }
    }

  }



  return groupedColumnDefs;


}