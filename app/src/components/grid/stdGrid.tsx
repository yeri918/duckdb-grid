import React, { useEffect, useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";

// grid Folder
import {
  ColumnDataType,
  RowData,
  ColumnDef,
  CountStatusBarComponentType,
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
  getColumnDefs,
  getLayeredColumnDefs,
  getGroupedColumnDefs,
} from "./gridHelper";
import "./style.css";

// duckGrid Folder
import duckGridDataSource from "../duckGrid/duckGridDS";
import CustomCountBar, {
  CustomFilterModelBar,
} from "../statusBar/duckCustomBar";

// table Folder
import db from "../table/duckDB";

// AgGrid imports
import { ColDef, StatusPanelDef } from "@ag-grid-community/core";
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
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const startTime = useRef(performance.now());
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [darkMode, setDarkMode] = useState(false);

  // region: Column Defs
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 100,
    };
  }, []);

  const autoGroupColumnDef = useMemo(() => {
    return {
      minWidth: 200,
    };
  }, []);

  const [columnDefs, setColumnDefs] = useState<ColumnDef[]>([]);
  useEffect(() => {
    const columnDefs = getColumnDefs(props.columnDataType);
    const layeredColumnDefs = getLayeredColumnDefs(props.columnDataType);
    const groupedColumnDefs = getGroupedColumnDefs(props.columnDataType);
    setColumnDefs(groupedColumnDefs);
  }, [props.columnDataType]);
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

  // COntextMenuItems
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

  const onCellClicked = (params: any) => {
    if (params.column.getColDef().chartDataType === "category") {
      return;
    }
    const cellRange = {
      rowStartIndex: params.rowIndex,
      rowEndIndex: params.rowIndex,
      columnStart: params.column,
      columnEnd: params.column,
    };

    const chartRangeParams = {
      cellRange: cellRange,
      chartType: "line",
    };

    params.api.createRangeChart(chartRangeParams);
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

  return (
    <div style={{ height: "100%", boxSizing: "border-box" }}>
      <div
        style={{
          position: "relative",
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
        }}
      >
        <div style={{ zIndex: 1 }}>
          <button className="menu-button" onClick={toggleDarkMode}>
            Toggle Dark Mode
          </button>
          <button className="menu-button" onClick={resetTable}>
            Reset Table
          </button>
        </div>

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
            // Multiple selection
            enableRangeSelection={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            // StatusBar
            statusBar={statusBar}
            enableCharts={true}
          />
        </div>
      </div>
    </div>
  );
};

export default StdAgGrid;
