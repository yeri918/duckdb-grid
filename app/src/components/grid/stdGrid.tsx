import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { Grid2, Button } from "@mui/material";

// grid Folder
import {
  ColumnDataType,
  RowData,
  ColumnDef,
  CountStatusBarComponentType,
  PrefetchedColumnValues,
} from "./gridTypes";
import handleKeyDown from "./gridShortcuts";
import {
  onFilterEqual,
  onFilterReset,
  onRowGroupCollapseAll,
  onRowGroupExpandOneLevel,
  onChartSelectedCells,
} from "./gridContextMenu";
import {
  getColumnSetValues,
  getColumnDefs,
  getLayeredColumnDefs,
  getGroupedColumnDefs,
} from "./gridHelper";
import "./style.css";

// duckGrid Folder
import duckGridDataSource from "../duckGrid/duckGridDS";
import CustomCountBar, {
  CustomFilterModelBar,
  CustomWaterMarkBar,
} from "../statusBar/duckCustomBar";

// table Folder
import db from "../table/duckDB";

// AgGrid imports
import { ColDef, StatusPanelDef, GridApi } from "@ag-grid-community/core";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface StdAgGridProps {
  columnDataType: ColumnDataType;
  darkMode?: boolean | null;
}

function arePropsEqual(
  prevProps: StdAgGridProps,
  nextProps: StdAgGridProps,
): boolean {
  return (
    prevProps.columnDataType === nextProps.columnDataType &&
    prevProps.darkMode === nextProps.darkMode
  );
}

const StdAgGrid: React.FC<StdAgGridProps> = (props) => {
  const [rowData, setRowData] = useState<RowData[] | null>(null);
  const [aggFunc, setAggFunc] = useState<string>("sum");
  const [gridApi, setGridApi] = useState<any>(null);
  const startTime = useRef(performance.now());
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [prefetchedColumnValues, setPrefetchedColumnValues] = useState({});

  // Detect if the user prefers dark mode
  const prefersDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [darkMode, setDarkMode] = useState(props.darkMode || prefersDarkMode);

  const [fitGrid, setFitGrid] = useState(false);
  const [execTime, setExecTime] = useState<number>(0);

  // region: Column Defs
  const defaultColDef = useMemo(() => {
    return {
      // flex: 1,
      // minWidth: 100,
      suppressSizeToFit: false,
      resizable: true,
    };
  }, []);

  const autoGroupColumnDef = useMemo(() => {
    return {
      // minWidth: 200,
    };
  }, []);

  useEffect(() => {
    setDarkMode(props.darkMode!);
    if (props.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [props.darkMode]);

  const [columnDefs, setColumnDefs] = useState<ColumnDef[]>([]);
  useEffect(() => {
    const fetchValues = async () => {
      const values: PrefetchedColumnValues = {};
      for (const key in props.columnDataType) {
        if (
          props.columnDataType[key] === "VARCHAR" ||
          props.columnDataType[key] === "DATE"
        ) {
          values[key] = await getColumnSetValues(key);
        }
      }
      setPrefetchedColumnValues(values);
    };

    fetchValues();
  }, [props.columnDataType]); // Fetch the values when the column data type changes

  useEffect(() => {
    const columnDefs = getColumnDefs(
      props.columnDataType,
      prefetchedColumnValues,
      gridApi,
    );
    const layeredColumnDefs = getLayeredColumnDefs(
      props.columnDataType,
      prefetchedColumnValues,
      gridApi,
    );
    const groupedColumnDefs = getGroupedColumnDefs(
      props.columnDataType,
      prefetchedColumnValues,
      gridApi,
    );
    setColumnDefs(groupedColumnDefs);
  }, [props.columnDataType, prefetchedColumnValues]); // Fetch the values when the column data type changes
  // endregion

  // region: ShortCuts
  // dl: useState will trigger a rerender of the grid. The useStates will be invalid.
  const ctrlFDown = useRef<boolean>(false);
  const ctrlEDown = useRef<boolean>(false);
  useEffect(() => {
    document.addEventListener("keydown", (event: KeyboardEvent) =>
      handleKeyDown(event, gridApi, ctrlFDown),
    );
    return () => {
      // This will remove the componet when the component is unmounted.
      // dl: not sur eif we can remove it
      document.removeEventListener("keydown", (event: KeyboardEvent) =>
        handleKeyDown(event, gridApi, ctrlFDown),
      );
    };
  }, [gridApi]);
  // endregion

  const source = `FROM bankdata
                  SELECT *`;
  const datasource = duckGridDataSource(db!, source);

  // ContextMenuItems
  const getContextMenuItems = (params: any) => {
    return [
      {
        name: "Filters",
        subMenu: [
          onFilterEqual(gridApi, params),
          onFilterReset(gridApi, params),
        ],
      },
      onFilterEqual(gridApi, params), // This is so commonly used, so we get itout.
      onFilterReset(gridApi, params),
      "separator",
      {
        name: "Groups",
        subMenu: [
          onRowGroupCollapseAll(gridApi, params),
          onRowGroupExpandOneLevel(gridApi, params),
        ],
      },
      onRowGroupCollapseAll(gridApi, params),
      onRowGroupExpandOneLevel(gridApi, params),
      "separator",
      onChartSelectedCells(gridApi, params, "line"),
      onChartSelectedCells(gridApi, params, "groupedColumn"),
      // onChartSelectedCells(gridApi, params),
      "separator",
      "copy",
      "export",
    ];
  };

  const statusBar = useMemo<{
    statusPanels: StatusPanelDef[];
  }>(() => {
    return {
      statusPanels: [
        {
          statusPanel: (props: CountStatusBarComponentType<any, any>) => (
            <CustomCountBar context={undefined} {...props} />
          ),
        },
        {
          statusPanel: (props: CountStatusBarComponentType<any, any>) => (
            <CustomFilterModelBar context={undefined} {...props} />
          ),
          align: "center",
        },
        {
          statusPanel: (props: CountStatusBarComponentType<any, any>) => (
            <CustomWaterMarkBar context={undefined} {...props} />
          ),
          align: "left",
        },
        { statusPanel: "agTotalAndFilteredRowCountComponent" },
        {
          statusPanel: "agAggregationComponent",
        },
      ],
    };
  }, []);

  const onModelUpdated = (params: any) => {};

  const onGridReady = (params: any) => {
    console.log("onGridReady", params);
    setGridApi(params.api);
  };

  // region: Load And Save Views
  const saveGridState = useCallback(async () => {
    console.log("dom check");
    if (gridApi) {
      const columnState = gridApi.getColumnState();
      let filterState = gridApi.getFilterModel();
      let sortState = gridApi.getSortModel();

      // Null handling
      if (filterState === null || Object.keys(filterState).length === 0) {
        filterState = { empty: "empty" };
      }
      if (sortState === undefined) {
        sortState = [];
      }

      console.log("check state", columnState, filterState, sortState);
      console.log(
        "check state2",
        `CREATE OR REPLACE TABLE saved_grid_states AS 
                SELECT ${JSON.stringify(sortState)} AS column_state, 
                      ${filterState} AS filter_state, 
                      ${sortState} AS sort_state `,
      );
      const connection = await db.connect();
      await connection.query(`CREATE OR REPLACE TABLE saved_grid_states AS 
                SELECT ${columnState} AS column_state, 
                      ${filterState} AS filter_state, 
                      ${sortState} AS sort_state `);
      await connection.close();
    }
  }, [gridApi]);

  useEffect(() => {
    window.addEventListener("beforeunload", saveGridState);
    return () => {
      window.removeEventListener("beforeunload", saveGridState);
    };
  }, [saveGridState]);

  const onFirstDataRendered = () => {
    const endTime = performance.now();
    const execTime = endTime - startTime.current;
    setExecTime(execTime);
  };

  // Buttons
  const resetTable = () => {
    if (gridApi) {
      gridApi.refreshCells();
      gridApi.expandAll(false);
      gridApi.setRowGroupColumns([]);
      gridApi.setSortModel([]);
    }
  };

  const autoSizeColumns = () => {
    if (!fitGrid) {
      if (gridApi) {
        gridApi.sizeColumnsToFit();
      }
    } else {
      const allColumnIds = gridApi
        .getColumnDefs()
        .map((column: { colId: any }) => column.colId);
      gridApi.autoSizeColumns(allColumnIds, {
        autoSizeMode: "fitCellContents",
      });
    }
    setFitGrid(!fitGrid);
  };

  const sideBar = {
    toolPanels: [
      {
        id: "columns",
        labelDefault: "Columns",
        labelKey: "columns",
        iconKey: "columns",
        toolPanel: "agColumnsToolPanel",
        toolPanelParams: {
          suppressValues: false,
          columnDisplayName: (col: { getColDef: () => any }) => {
            const colDef = col.getColDef();
            return colDef.headerName;
          },
        },
      },
      {
        id: "filters",
        labelDefault: "Filters",
        labelKey: "filters",
        iconKey: "filter",
        toolPanel: "agFiltersToolPanel",
      },
    ],
    defaultToolPanel: "columns",
  };

  function renderExecutionTime() {
    if (execTime === 0) {
      return (
        <div className="loading">
          <span className="dot">🟡</span>
          <span className="dot">🟡</span>
          <span className="dot">🟡</span>
        </div>
      );
    } else {
      return <div>Exec: {execTime.toFixed(2)} ms</div>;
    }
  }

  return (
    <Grid2
      container
      direction="column"
      style={{
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Buttons */}
      <Grid2 sx={{ display: "flex", height: "7%" }}>
        <Grid2 sx={{ width: "80%" }}>
          <Grid2 container justifyContent="flex-start" spacing={2}>
            <Grid2>
              <Button
                style={{ outline: "none" }}
                variant="contained"
                onClick={resetTable}
              >
                Reset Table
              </Button>
            </Grid2>
            <Grid2>
              <Button
                style={{ outline: "none" }}
                variant="contained"
                onClick={autoSizeColumns}
              >
                Autosize Columns
              </Button>
            </Grid2>
            <Grid2>
              <Button
                style={{ outline: "none" }}
                variant="contained"
                onClick={saveGridState}
              >
                Save View
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
        <Grid2
          sx={{
            width: "100%",
            alignSelf: "flex-end",
            mb: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            {renderExecutionTime()}
          </div>
        </Grid2>
      </Grid2>
      <Grid2 style={{ flexGrow: 1, height: "80%" }}>
        <div
          style={gridStyle}
          className={
            darkMode === null
              ? prefersDarkMode
                ? "ag-theme-alpine-dark"
                : "ag-theme-alpine"
              : props.darkMode
                ? "ag-theme-alpine-dark"
                : "ag-theme-alpine"
          }
        >
          <AgGridReact
            /*
              SSRM Grid Options. Reference: see https://www.ag-grid.com/react-data-grid/server-side-model-api-reference/
            */
            rowModelType="serverSide"
            serverSideDatasource={datasource}
            purgeClosedRowNodes={true}
            maxConcurrentDatasourceRequests={1}
            blockLoadDebounceMillis={300} // This is added to prevent the loading... message from flickering, but eac
            serverSideSortAllLevels={true}
            serverSideOnlyRefreshFilteredGroups={true}
            /*
              Place Holder
            */
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            getContextMenuItems={getContextMenuItems}
            multiSortKey={"ctrl"}
            // sideBar={true}
            sideBar={sideBar}
            serverSidePivotResultFieldSeparator="_"
            suppressAggFuncInHeader={true}
            onModelUpdated={onModelUpdated}
            onGridReady={onGridReady}
            onFirstDataRendered={onFirstDataRendered}
            rowHeight={25}
            headerHeight={25}
            suppressMultiSort={false}
            colResizeDefault="shift"
            // Multiple selection
            enableRangeSelection={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            // StatusBar
            statusBar={statusBar}
            enableCharts={true}
            // Grouping
            suppressRowGroupHidesColumns={true}
          />
        </div>
      </Grid2>
    </Grid2>
  );
};

// export default StdAgGrid;
export default React.memo(StdAgGrid, arePropsEqual);
