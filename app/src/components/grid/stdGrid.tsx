import React, { useEffect, useState, useMemo, useRef } from "react";
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
  setExecutionTime?: React.Dispatch<React.SetStateAction<number>>;
}

const StdAgGrid: React.FC<StdAgGridProps> = (props) => {
  const [rowData, setRowData] = useState<RowData[] | null>(null);
  const [aggFunc, setAggFunc] = useState<string>("sum");
  const [gridApi, setGridApi] = useState<any>(null);
  const startTime = useRef(performance.now());
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [prefetchedColumnValues, setPrefetchedColumnValues] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [fitGrid, setFitGrid] = useState(false);

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
      onChartSelectedCells(gridApi, params),
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
    setGridApi(params.api);
  };

  const onFirstDataRendered = () => {
    const endTime = performance.now();
    const execTime = endTime - startTime.current;
    if (props.setExecutionTime) {
      props.setExecutionTime(execTime);
    }
  };

  // Dark Mode
  useEffect(() => {
    // Check if the user has set their browser to dark mode
    const userPrefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Set the state variable based on the user's preference
    setDarkMode(userPrefersDark);

    if (userPrefersDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, []);

  // Buttons
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

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
      console.log("pjulie", allColumnIds);
      gridApi.autoSizeColumns(allColumnIds, {
        autoSizeMode: "fitCellContents",
      });
    }
    setFitGrid(!fitGrid);
  };

  return (
    <Grid2
      container
      direction="column"
      style={{ height: "100%", boxSizing: "border-box" }}
    >
      <Grid2 sx={{ mb: 2 }}>
        <Grid2 container justifyContent="flex-start" spacing={2}>
          <Grid2>
            <Button variant="contained" onClick={toggleDarkMode}>
              Toggle Dark Mode
            </Button>
          </Grid2>
          <Grid2>
            <Button variant="contained" onClick={resetTable}>
              Reset Table
            </Button>
          </Grid2>
          <Grid2>
            <Button variant="contained" onClick={autoSizeColumns}>
              Autosize Columns
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
      <Grid2 style={{ flexGrow: 1 }}>
        <div
          style={gridStyle}
          className={darkMode ? "ag-theme-alpine-dark" : "ag-theme-alpine"}
        >
          <AgGridReact
            rowModelType="serverSide"
            serverSideDatasource={datasource}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            getContextMenuItems={getContextMenuItems}
            multiSortKey={"ctrl"}
            sideBar={true}
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

export default StdAgGrid;
