import React, { useEffect, useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { Grid2, Button } from "@mui/material";

// grid Folder
import {
  ColumnDataType,
  StdAgGridProps,
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
import GridLoadingOverlay from "./gridLoadingOverlay";
import "./style.css";

// duckGrid Folder
import duckGridDataSource from "../duckGridDS/duckGridDS";
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
  const [gridApi, setGridApi] = useState<any>(null);
  const startTime = useRef(performance.now());
  const [columnDataTypes, setColumnDataTypes] = useState<ColumnDataType>({});
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

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
      console.log("pjulie column data types", columnDataTypes);
      await connection.close();
      return columnDataTypes;
    };
    const fetchColumnSetValues = async () => {
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
      //   gridApi,
      // );
      const columnDataTypes = await fetchColumnDataTypes();
      console.log("pjulie ", columnDataTypes);
      const columnSetValues = await fetchColumnSetValues();
      const groupedColumnDefs = getGroupedColumnDefs(
        columnDataTypes,
        columnSetValues,
        gridApi,
      );

      setColumnDefs(groupedColumnDefs);
    };
    fetchColumnDefs();
  }, [props.tableName]);

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
  const datasource = duckGridDataSource(db!, source, props.tableName);
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
            props: CountStatusBarComponentType<any, any>,
            tableName: string,
          ) => <CustomCountBar context={undefined} {...props} />,
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
  // endregion

  // region: onModelUpdated / onGridReady / onFirstDataRendered
  const onModelUpdated = (params: any) => {
    console.log("std onModelUpdated", params);
  };

  const onGridReady = (params: any) => {
    console.log("std onGridReady");
    setGridApi(params.api);
    console.log("pjulie column defs", columnDefs);
  };

  const onFirstDataRendered = () => {
    const endTime = performance.now();
    const execTime = endTime - startTime.current;
    setExecTime(execTime);
    setLoading(false);
  };
  // endregion

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
  // endregion

  // region: Loading Overlay
  const loadingOverlayComponentParams = useMemo(() => {
    return {
      loadingMessage: "Just one moment please...",
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

  return (
    <Grid2
      container
      direction="column"
      style={{
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <Grid2 sx={{ display: "flex", height: "7%" }}>
        <Grid2 sx={{ width: "80%" }}>
          {/* 
          // region: Buttons 
          */}
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
      {/* 
      // endregion 
      */}
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
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            getContextMenuItems={getContextMenuItems}
            multiSortKey={"ctrl"}
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
            loading={loading}
            animateRows={true}
            // Multiple selection
            enableRangeSelection={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            // StatusBar
            statusBar={statusBar}
            enableCharts={true}
            // Grouping
            suppressRowGroupHidesColumns={true}
            // Loading Overlay
            loadingOverlayComponent={GridLoadingOverlay}
            loadingOverlayComponentParams={loadingOverlayComponentParams}
          />
        </div>
      </Grid2>
    </Grid2>
  );
};

// export default StdAgGrid;
export default React.memo(StdAgGrid, arePropsEqual);
