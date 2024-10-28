import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { Button, Tooltip } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// grid Folder
import {
  ColumnDataType,
  StdAgGridProps,
  ColumnDef,
  CountStatusBarComponentType,
  PrefetchedColumnValues,
  Context,
} from "./interface/GridInterface";
import handleKeyDown from "./lib/keyShortcuts";
import {
  onFilterEqual,
  onFilterReset,
  onRowGroupCollapseAll,
  onRowGroupExpandOneLevel,
  onChartSelectedCells,
} from "./lib/contextMenu";
import { getColumnSetValues, getGroupedColumnDefs } from "./lib/columnHelper";
import initStateTable, {
  fetchPreviousState,
  saveState,
  applySavedState,
} from "./lib/gridStates";
import AdvancedFilterBar from "./AdvancedFilterBar";
import GridLoadingOverlay from "./LoadingOverlay";
import "./StdGrid.css";

// duckGrid Folder
import duckGridDataSource from "./datasource/duckGridDataSource";
import CustomCountBar, {
  CustomFilterModelBar,
  CustomWaterMarkBar,
} from "./CustomStatusBar";

// table Folder
import db from "../../duckDB";

// AgGrid imports
import { StatusPanelDef } from "@ag-grid-community/core";
import {
  GridApi,
  GridPreDestroyedEvent,
  IsServerSideGroupOpenByDefaultParams,
} from "ag-grid-community";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function arePropsEqual(
  prevProps: StdAgGridProps,
  nextProps: StdAgGridProps,
): boolean {
  return (
    prevProps.darkMode === nextProps.darkMode &&
    prevProps.tabName === nextProps.tabName &&
    prevProps.tableName === nextProps.tableName
  );
}

const StdAgGrid: React.FC<StdAgGridProps> = (props) => {
  const [columnDefs, setColumnDefs] = useState<ColumnDef[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const context = useRef<Context | undefined>(null);
  const startTime = useRef(performance.now());
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [openGroups, setOpenGroups] = useState<string[] | undefined>([]);
  const [advancedFilterFlag, setAdvancedFilterFlag] = useState<boolean>(true); // false specifically means advanced filter has failed

  useEffect(() => {
    console.log("StdAgGrid: Mounted or Rerendered");
  }, []);

  // Detect if the user prefers dark mode
  const prefersDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [darkMode, setDarkMode] = useState(props.darkMode || prefersDarkMode);
  const [fitGrid, setFitGrid] = useState(false);
  const [execTime, setExecTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // region: Dark Mode
  useEffect(() => {
    setDarkMode(props.darkMode!);
    if (props.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [props.darkMode]);
  // endregion

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
    const fetchColumnDataTypes = async () => {
      const connection = await db.connect();
      const query = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '${props.tableName}';
      `;
      const result = await connection.query(query);
      const columnDataTypes: ColumnDataType = {};
      result.toArray().forEach((row: any) => {
        columnDataTypes[row.column_name] = row.data_type;
      });
      await connection.close();
      return columnDataTypes;
    };
    const fetchColumnSetValues = async (columnDataTypes: ColumnDataType) => {
      const values: PrefetchedColumnValues = {};
      for (const key in columnDataTypes) {
        if (
          columnDataTypes[key] === "VARCHAR" ||
          columnDataTypes[key] === "DATE"
        ) {
          values[key] = await getColumnSetValues(key, props.tableName);
        }
      }
      return values;
    };
    const fetchColumnDefs = async () => {
      const columnDataTypes = await fetchColumnDataTypes();
      const columnSetValues = await fetchColumnSetValues(columnDataTypes);
      const groupedColumnDefs = getGroupedColumnDefs(
        columnDataTypes,
        columnSetValues,
        gridApi,
      );

      setColumnDefs(groupedColumnDefs);
    };
    fetchColumnDefs();
  }, []);

  // endregion

  // region: ShortCuts
  // dl: useState will trigger a rerender of the grid. The useStates will be invalid.
  const ctrlFDown = useRef<boolean>(false);
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

  // region: DataSource
  const source = `FROM ${props.tableName}
                  SELECT *`;
  const datasource = duckGridDataSource(
    db!,
    source,
    props.tableName,
    setAdvancedFilterFlag,
  );
  // endregion

  // region: Context Menu
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
  // endregion

  // region: Status Bar
  const statusBar = useMemo<{
    statusPanels: StatusPanelDef[];
  }>(() => {
    return {
      statusPanels: [
        {
          statusPanel: (
            customProps: CountStatusBarComponentType<any, any>,
            tableName: string,
          ) => (
            <CustomCountBar
              context={undefined}
              {...customProps}
              tableName={props.tableName}
            />
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
            <CustomWaterMarkBar />
          ),
          align: "left",
        },
        { statusPanel: "agTotalAndFilteredRowCountComponent" },
        {
          statusPanel: "agAggregationComponent",
        },
      ],
    };
  }, [props.tableName]);
  // endregion

  // region: onModelUpdated / onGridReady / onFirstDataRendered / isServerSideGroupOpenByDefault
  const onModelUpdated = (params: any) => {};

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  const onFirstDataRendered = useCallback(
    (params: any) => {
      const endTime = performance.now();
      const execTime = endTime - startTime.current;
      setExecTime(execTime);
      setLoading(false);

      // States
      initStateTable(); // Create table if not exists.
      applySavedState(gridApi, props.tableName, "auto"); // TODO: would need refactoring with below.
      fetchPreviousState(props.tableName, "auto").then((result: any) => {
        console.log("leudom result", result);
        const gridState = JSON.parse(result[0].state);
        if (gridState) {
          setOpenGroups(gridState.rowGroupExpansion?.expandedRowGroupIds);
        }
      });
      // setOpenGroups(["hihihi"]);
    },
    [gridApi],
  );

  const onGridPreDestroyed = useCallback((params: GridPreDestroyedEvent) => {
    saveState(params.api, props.tableName, "auto");
    console.log("leudom gridState saved", params.api);
  }, []);

  const isServerSideGroupOpenByDefault = useCallback(
    (params: IsServerSideGroupOpenByDefaultParams) => {
      var route = params.rowNode.getRoute();
      if (!route) {
        return false;
      }

      if (params.rowNode) {
        return params.rowNode.id
          ? (openGroups?.includes(params.rowNode.id) ?? false) // Only return true if not undefined and is in openGroups
          : false;
      } else {
        return false;
      }
    },
    [openGroups],
  );

  // region: Buttons
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
          suppressValues: true, // suppresses the values at the bottom of the sidebar
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
  // endregion

  // region: Loading Overlay
  const loadingOverlayComponentParams = useMemo(() => {
    return {
      loadingMessage: "Loading... We are almost there. ✨",
    };
  }, []);

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

  const [isRegionVisible, setIsRegionVisible] = useState(true);

  const toggleRegionVisibility = () => {
    setIsRegionVisible(!isRegionVisible);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [additionalButtons, setAdditionalButtons] = useState<number[]>([]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Add more buttons when expanding
      setAdditionalButtons([
        ...additionalButtons,
        additionalButtons.length + 1,
      ]);
    }
  };

  const addMoreButtons = () => {
    setAdditionalButtons([...additionalButtons, additionalButtons.length + 1]);
  };

  return (
    <Box
      sx={{
        height: isExpanded ? "90%" : "100%",
        boxSizing: "border-box",
        // border: "1px solid red",
      }}
    >
      <Box sx={{ display: "flex", width: "100%" }}>
        <Box
          sx={{
            p: 3,
            mt: -3,
            // border: "1px solid red",
            width: "90%",
          }}
        >
          {/* Button Container */}
          <Grid container spacing={2} alignItems="center">
            {/* Button: Reset table */}
            <Grid spacing={2}>
              <Tooltip title="Removes the row groups and filters.">
                <Button
                  variant="contained"
                  onClick={resetTable}
                  sx={{ width: 100, fontSize: 12 }}
                >
                  Reset
                </Button>
              </Tooltip>
            </Grid>
            {/* Button: Autosize the columns */}
            <Grid spacing={2}>
              <Tooltip title="Autosizes the columns.">
                <Button
                  variant="contained"
                  onClick={autoSizeColumns}
                  sx={{ width: 100, fontSize: 12 }}
                >
                  Autosize
                </Button>
              </Tooltip>
            </Grid>
            {/* Button: Save view */}
            <Grid spacing={2}>
              <Tooltip title="Saves the current view with row groups and filters.">
                <Button
                  variant="contained"
                  onClick={() => saveState(gridApi, props.tableName, "manual")}
                  sx={{ width: 100, fontSize: 12 }}
                >
                  Save
                </Button>
              </Tooltip>
            </Grid>
            <Grid>
              <Tooltip title="Retrieve the saved view.">
                <Button
                  variant="contained"
                  onClick={() => {
                    // Might need to refactor too.
                    applySavedState(gridApi, props.tableName, "manual");
                    fetchPreviousState(props.tableName, "manual").then(
                      (result: any) => {
                        console.log("leudom result", result);
                        const gridState = JSON.parse(result[0].state);
                        if (gridState) {
                          setOpenGroups(
                            gridState.rowGroupExpansion?.expandedRowGroupIds,
                          );
                        }
                      },
                    );
                  }}
                  sx={{ width: 100, fontSize: 12 }}
                >
                  Load
                </Button>
              </Tooltip>
            </Grid>
            {/* Button: Collapse/Expand for more buttons.  */}
            <Grid spacing={2}>
              <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
                <Button
                  variant="contained"
                  onClick={toggleExpand}
                  color="secondary"
                  sx={{ width: 50 }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Button>
              </Tooltip>
            </Grid>
            {/* Execution Time render */}
            <Grid
              container
              justifyContent="space-between"
              sx={{
                display: "flex",
                mb: 1,
                // border: "1px solid red",
              }}
            ></Grid>
          </Grid>
          {/* Additional Buttons */}
          {isExpanded && (
            <Box sx={{ mt: 2, width: "100%" }}>
              <Grid sx={{ xs: 12, width: "100%" }}>
                <AdvancedFilterBar
                  gridApi={gridApi}
                  darkMode={props.darkMode ?? false}
                  success={advancedFilterFlag}
                />
              </Grid>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            p: 3,
            // border: "1px solid red",
            width: "10%",
            position: "relative",
          }}
        >
          <Grid
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              mb: 1,
            }}
          >
            <div>{renderExecutionTime()}</div>
          </Grid>
        </Box>
      </Box>

      {/* 
      // endregion 
      */}
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
          context={context.current}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          getContextMenuItems={getContextMenuItems}
          multiSortKey={"ctrl"}
          sideBar={sideBar}
          serverSidePivotResultFieldSeparator="_"
          suppressAggFuncInHeader={false} // whether to show aggFunc in header when grouping
          onModelUpdated={onModelUpdated}
          onGridReady={onGridReady}
          onFirstDataRendered={onFirstDataRendered}
          onGridPreDestroyed={onGridPreDestroyed}
          rowHeight={25}
          headerHeight={25}
          suppressMultiSort={false}
          colResizeDefault="shift"
          loading={loading}
          animateRows={true}
          // Client Side Sorting
          // https://www.ag-grid.com/javascript-data-grid/server-side-model-sorting/#client-side-sorting
          serverSideEnableClientSideSort={true}
          // Multiple selection
          enableRangeSelection={true}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          // StatusBar
          statusBar={statusBar}
          enableCharts={true}
          // Grouping
          // groupDefaultExpanded={2}
          isServerSideGroupOpenByDefault={isServerSideGroupOpenByDefault}
          suppressRowGroupHidesColumns={true}
          // Loading Overlay
          loadingOverlayComponent={GridLoadingOverlay}
          loadingOverlayComponentParams={loadingOverlayComponentParams}
          // Extra
          suppressPropertyNamesCheck={true}
        />
      </div>
    </Box>
  );
};

// export default StdAgGrid;
export default React.memo(StdAgGrid, arePropsEqual);
