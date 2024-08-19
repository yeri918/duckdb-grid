import React, { useEffect, useState, useMemo, useRef } from "react";
import { ColumnDataType, RowData, ColumnDef, CountStatusBarComponentType } from './gridTypes';
import CountStatusBarComponent from '../duckGrid/duckStatusBar';
import handleKeyPressed from "./gridShortcuts";
import { AgGridReact } from "ag-grid-react";
import { ColDef, StatusPanelDef } from '@ag-grid-community/core';
import "ag-grid-enterprise";
import duckGridDataSource from "../duckGrid/duckGridDS";
import db from "../table/duckDB";
import { getColumnDefs, getLayeredColumnDefs, getGroupedColumnDefs } from './gridHelper'
import './style.css';
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

  // region: ShortCuts
  // dl: useState will trigger a rerender of the grid. The useStates will be invalid.
  const ctrlFDown = useRef<boolean>(false);
  const ctrlEDown = useRef<boolean>(false);
  // endregion


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

  useEffect(() => {

    document.addEventListener("keydown", (event: KeyboardEvent) => handleKeyPressed(event, gridApi, ctrlFDown));
    return () => {
      // This will remove the componet when the component is unmounted.
      // dl: THis is very very import !!!! 
      document.removeEventListener("keydown", (event: KeyboardEvent) => handleKeyPressed(event, gridApi, ctrlFDown));
    };
  }, [gridApi]);

  const source = `FROM bankdata
                  SELECT *`;
  const datasource = duckGridDataSource(db!, source);

  const getContextMenuItems = (params: any) => {
    return [
      // ...any other menu items you want to include
      {
        name: "Filters",
        subMenu: [
          {
            name: "Filter Equal",
            action: () => {
              const selectedValue = params.value;
              console.log("check", params.column.getColId(), params.value, params)
              gridApi.setFilterModel({
                [params.column.getColId()]: {
                  type: "equals",
                  filter: selectedValue
                }
              });
              gridApi.onFilterChanged();
            }
          },
          "separator",
          {
            name: "Reset Filters",
            action: () => {
              gridApi.setFilterModel(null);
              gridApi.onFilterChanged();
            }
          },
          {
            name: "Option 3",
            action: () => {
              // Code for Option 3
            }
          }
        ],
      },
      "separator",
      {
        name: "Groups",
        subMenu: [
          {
            name: "Collapse All",
            action: () => {
              // Code for Option 1
              gridApi?.collapseAll();

            }
          },
          {
            name: "Expand First Level",
            action: () => {
              // Code for Option 2

              gridApi?.forEachNode((node: any) => {
                if (node.level === 0) {
                  node.setExpanded(true);
                } else {
                  node.setExpanded(false);
                }
              });
            }
          },
          {
            name: "Option 3",
            action: () => {
              // Code for Option 3

            }
          }
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
          statusPanel: (props: CountStatusBarComponentType<any, any>) => <CountStatusBarComponent context={undefined} {...props} {...db} />,
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
