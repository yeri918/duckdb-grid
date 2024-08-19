import React, { useEffect, useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";

// grid Folder
import {
  ColumnDataType, RowData,
  ColumnDef, CountStatusBarComponentType
} from './gridTypes';
import handleKeyDown from "./gridShortcuts";
import {
  onFilterEqual, onFilterReset,
  onRowGroupCollapseAll, onRowGroupExpandOneLevel
} from "./gridContextMenu";
import {
  getColumnDefs, getLayeredColumnDefs,
  getGroupedColumnDefs
} from './gridHelper'
import './style.css';

// duckGrid Folder
import duckGridDataSource from "../duckGrid/duckGridDS";
import CountStatusBarComponent from '../statusBar/duckCountBar';

// table Folder
import db from "../table/duckDB";

// AgGrid imports
import { ColDef, StatusPanelDef } from '@ag-grid-community/core';
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
  const gridStyle = useMemo(() => ({ height: "90%", width: "100%" }), []);

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
    const columnDefs = getColumnDefs(props.columnDataType)
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

    document.addEventListener("keydown", (event: KeyboardEvent) => handleKeyDown(event, gridApi, ctrlFDown));
    return () => {
      // This will remove the componet when the component is unmounted.
      // dl: not sur eif we can remove it
      document.removeEventListener("keydown", (event: KeyboardEvent) => handleKeyDown(event, gridApi, ctrlFDown));
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
      "separator",
      {
        name: "Groups",
        subMenu: [
          onRowGroupCollapseAll(gridApi, params),
          onRowGroupExpandOneLevel(gridApi, params),
        ],
      },
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
          statusPanel: (props: CountStatusBarComponentType<any, any>) => <CountStatusBarComponent />,
        },
        {
          statusPanel: 'agAggregationComponent',
          statusPanelParams: {
            aggFuncs: ['count', 'sum'],
          },
        },
      ],
    };
  }, []);


  const onModelUpdated = (params: any) => {
  };

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

  return (
    <div >
      <div style={{ height: "100%", boxSizing: "border-box", }}>
        <div style={gridStyle} className="ag-theme-alpine">

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
            suppressMultiSort={false}
            // Multiple selection
            enableRangeSelection={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            // StatusBar
            statusBar={statusBar}
          />
        </div>
      </div>
    </div>
  );
};

export default StdAgGrid;
