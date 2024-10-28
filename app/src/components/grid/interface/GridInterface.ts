import { ColDef } from "ag-grid-enterprise";

// region: Data Types
/* 
  Based on DuckDB WASM Formats
  https://duckdb.org/docs/sql/data_types/overview.html
  We didn't enumerate all, but you can add more.
*/
export type DataType = "VARCHAR" | "DATE" | "INTEGER" | "DOUBLE" | "FLOAT";

export type NumericDataType = "INTEGER" | "DOUBLE" | "FLOAT";
// endregion

// region: General Interfaces
export interface RowData {
  [key: string]: string | number;
}

export interface StdAgGridProps {
  tabName: string;
  tableName: string;
  darkMode?: boolean | null;
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
  children?: (ColumnDef | undefined)[] | ColumnDef | undefined;
}

export interface ContextMenuItem {
  name: string;
  action: () => void;
}

export interface CountStatusBarComponentType<T, P> {
  api: T;
  params: P;
  tableName: string | null;
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

export interface PrefetchedColumnValues {
  [key: string]: unknown;
}

export interface Context {
  advancedFilter: string;
}
// endregion
