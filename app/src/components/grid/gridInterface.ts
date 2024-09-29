import { Column, RowClassParams, ColDef, GridApi } from "ag-grid-enterprise";

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
  children?: ColumnDef[] | ColumnDef | null;
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
  [key: string]: any;
}
// endregion

// region: Grid States
interface GridPreDestroyedEvent<TData = any, TContext = any> {
  // Current state of the grid
  state: GridState;
  // The grid api.
  api: GridApi<TData>;
  // Application context as set on `gridOptions.context`.
  context: TContext;
  // Event identifier
  type: "gridPreDestroyed";
}

export interface GridState {
  // Grid version number
  version?: string;
  // Includes aggregation functions (column state)
  aggregation?: AggregationState;
  // Includes opened groups
  columnGroup?: ColumnGroupState;
  // Includes column ordering (column state)
  columnOrder?: ColumnOrderState;
  // Includes left/right pinned columns (column state)
  columnPinning?: ColumnPinningState;
  // Includes column width/flex (column state)
  columnSizing?: ColumnSizingState;
  // Includes hidden columns (column state)
  columnVisibility?: ColumnVisibilityState;
  // Includes Column Filters and Advanced Filter
  filter?: FilterState;
  // Includes currently focused cell. Works for Client-Side Row Model only
  focusedCell?: FocusedCellState;
  // Includes current page
  pagination?: PaginationState;
  // Includes current pivot mode and pivot columns (column state)
  pivot?: PivotState;
  // Includes currently selected cell ranges
  cellSelection?: CellSelectionState;
  // Includes current row group columns (column state)
  rowGroup?: RowGroupState;
  // Includes currently expanded group rows
  rowGroupExpansion?: RowGroupExpansionState;
  // Includes currently selected rows.
  // For Server-Side Row Model, will be `ServerSideRowSelectionState | ServerSideRowGroupSelectionState`,
  // for other row models, will be an array of row IDs
  rowSelection?:
    | string[]
    | ServerSideRowSelectionState
    | ServerSideRowGroupSelectionState;
  // Includes current scroll position. Works for Client-Side Row Model only
  scroll?: ScrollState;
  // Includes current Side Bar positioning and opened tool panel
  sideBar?: SideBarState;
  // Includes current sort columns and direction (column state)
  sort?: SortState;
  // When providing a partial `initialState` with some but not all column state properties, set this to `true`.
  // Not required if passing the whole state object retrieved from the grid.
  partialColumnState?: boolean;
}

interface AggregationState {
  aggregationModel: AggregationColumnState[];
}

interface AggregationColumnState {
  colId: string;
  // Only named aggregation functions can be used in state
  aggFunc: string;
}

interface ColumnGroupState {
  openColumnGroupIds: string[];
}

interface ColumnOrderState {
  // All colIds in order
  orderedColIds: string[];
}

interface ColumnPinningState {
  leftColIds: string[];
  rightColIds: string[];
}

interface ColumnSizingState {
  columnSizingModel: ColumnSizeState[];
}

interface ColumnSizeState {
  colId: string;
  width?: number;
  flex?: number;
}

interface ColumnVisibilityState {
  hiddenColIds: string[];
}

interface FilterState {
  filterModel?: FilterModel;
  advancedFilterModel?: AdvancedFilterModel;
}

type AdvancedFilterModel = JoinAdvancedFilterModel | ColumnAdvancedFilterModel;

interface JoinAdvancedFilterModel {
  filterType: "join";
  // How the conditions are joined together
  type: "AND" | "OR";
  // The filter conditions that are joined by the `type`
  conditions: AdvancedFilterModel[];
}

type ColumnAdvancedFilterModel =
  | TextAdvancedFilterModel
  | NumberAdvancedFilterModel
  | BooleanAdvancedFilterModel
  | DateAdvancedFilterModel
  | DateStringAdvancedFilterModel
  | ObjectAdvancedFilterModel;

interface TextAdvancedFilterModel {
  filterType: "text";
  // The ID of the column being filtered.
  colId: string;
  // The filter option that is being applied.
  type: TextAdvancedFilterModelType;
  // The value to filter on. This is the same value as displayed in the input.
  filter?: string;
}

type TextAdvancedFilterModelType =
  | "equals"
  | "notEqual"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

interface NumberAdvancedFilterModel {
  filterType: "number";
  // The ID of the column being filtered.
  colId: string;
  // The filter option that is being applied.
  type: ScalarAdvancedFilterModelType;
  // The value to filter on.
  filter?: number;
}

type ScalarAdvancedFilterModelType =
  | "equals"
  | "notEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "blank"
  | "notBlank";

interface BooleanAdvancedFilterModel {
  filterType: "boolean";
  // The ID of the column being filtered.
  colId: string;
  // The filter option that is being applied.
  type: BooleanAdvancedFilterModelType;
}

type BooleanAdvancedFilterModelType = "true" | "false";

interface DateAdvancedFilterModel {
  filterType: "date";
  // The ID of the column being filtered.
  colId: string;
  // The filter option that is being applied.
  type: ScalarAdvancedFilterModelType;
  // The value to filter on. This is in format `YYYY-MM-DD`.
  filter?: string;
}

interface DateStringAdvancedFilterModel {
  filterType: "dateString";
  // The ID of the column being filtered.
  colId: string;
  // The filter option that is being applied.
  type: ScalarAdvancedFilterModelType;
  // The value to filter on. This is in format `YYYY-MM-DD`.
  filter?: string;
}

interface ObjectAdvancedFilterModel {
  filterType: "object";
  // The ID of the column being filtered.
  colId: string;
  // The filter option that is being applied.
  type: TextAdvancedFilterModelType;
  // The value to filter on. This is the same value as displayed in the input.
  filter?: string;
}

interface FocusedCellState {
  colId: string;
  // A positive number from 0 to n, where n is the last row the grid is rendering
  // or -1 if you want to navigate to the grid header
  rowIndex: number;
  // Either 'top', 'bottom' or null/undefined (for not pinned)
  rowPinned: RowPinnedType;
}

type RowPinnedType = "top" | "bottom" | null | undefined;

interface PaginationState {
  // Current page
  page?: number;
  // Current page size. Only use when the pageSizeSelector dropdown is visible
  pageSize?: number;
}

interface PivotState {
  pivotMode: boolean;
  pivotColIds: string[];
}

interface CellSelectionState {
  cellRanges: CellSelectionCellState[];
}

interface CellSelectionCellState {
  id?: string;
  type?: CellRangeType;
  // The start row of the range
  startRow?: RowPosition;
  // The end row of the range
  endRow?: RowPosition;
  // The columns in the range
  colIds: string[];
  // The start column for the range
  startColId: string;
}

enum CellRangeType {
  VALUE,
  DIMENSION,
}

interface RowPosition {
  // A positive number from 0 to n, where n is the last row the grid is rendering
  // or -1 if you want to navigate to the grid header
  rowIndex: number;
  // Either 'top', 'bottom' or null/undefined (for not pinned)
  rowPinned: RowPinnedType;
}

interface RowGroupState {
  // Grouped columns in order
  groupColIds: string[];
}

interface RowGroupExpansionState {
  expandedRowGroupIds: string[];
}

interface ServerSideRowSelectionState {
  // Whether the majority of rows are selected or not
  selectAll: boolean;
  // All rows that have the opposite selection state to `selectAll`
  toggledNodes: string[];
}

interface ServerSideRowGroupSelectionState {
  nodeId?: string;
  selectAllChildren?: boolean;
  toggledNodes?: ServerSideRowGroupSelectionState[];
}

interface ScrollState {
  top: number;
  left: number;
}

interface SideBarState {
  // Is side bar visible
  visible: boolean;
  position: "left" | "right";
  // Open tool panel, or null if closed
  openToolPanel: string | null;
  // State for each tool panel
  toolPanels: { [id: string]: any };
}

interface SortState {
  // Sorted columns and directions in order
  sortModel: SortModelItem[];
}

interface SortModelItem {
  // Column Id to apply the sort to.
  colId: string;
  // Sort direction
  sort: "asc" | "desc";
}
// endregion
