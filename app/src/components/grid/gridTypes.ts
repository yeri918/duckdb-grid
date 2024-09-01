import { Column, RowClassParams, ColDef } from "ag-grid-enterprise";

/* 
  Based on DuckDB WASM Formats
  https://duckdb.org/docs/sql/data_types/overview.html
  We didn't enumerate all, but you can add more.
*/
export type DataType = "VARCHAR" | "DATE" | "INTEGER" | "DOUBLE" | "FLOAT";

export type NumericDataType = "INTEGER" | "DOUBLE" | "FLOAT";

export interface RowData {
  [key: string]: string | number;
}

export interface ColumnDataType {
  [key: string]: DataType;
}

export interface ColumnDef extends ColDef {
  headerName: string;
  field: string;
  enableRowGroup: boolean;
  enableValue: boolean;
  filter: string;
  children?: ColumnDef[] | ColumnDef | null;
}

export interface ContextMenuItem {
  name: string;
  action: () => void;
}

export interface CountStatusBarComponentType<T, P> {
  api: T;
  params: P;
}

export interface SingleFilterModel {
  filter: string;
  filterType: string;
  type: string;
  filterModels?: SingleFilterModel[];
  values?: string[];
}

export interface MultiFilterModel {
  filterType: string;
  operator: string;
  conditions: SingleFilterModel[];
  filterModels?: SingleFilterModel[];
  values?: string[];
}

export interface FilterModel {
  [key: string]: SingleFilterModel | MultiFilterModel;
}
