import React, { useEffect, useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import './style.css';
import { Column, RowClassParams } from "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import duckGridDataSource from "../duckGrid/duckGridDS";
import db from "../table/duckDB";
import {columnDataType} from '../table/initTable';

interface RowData {
  [key: string]: string | number;
}

interface RowParams {
  value: string;
}

interface StdAgGridProps {
  columnDataType: columnDataType;
}

interface ColumnDef {
  headerName: string;
  field: string;
  enableRowGroup: boolean;
  enableValue: boolean;
  filter: string;
}


const StdAgGrid: React.FC<StdAgGridProps> = (props) => {
  const [rowData, setRowData] = useState<RowData[] | null>(null);
  const [aggFunc, setAggFunc] = useState<string>("sum");
  const [gridApi, setGridApi] = useState<any>(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "1000px", width: "100%" }), []);
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


  const getColumnDefs = (columnDataType: columnDataType) => {
    let columnDefs = [];
    for (const key in columnDataType) {
      columnDefs.push({
        headerName: key,
        field: key,
        enableRowGroup: true,
        enableValue: true,
        filter: 'agTextColumnFilter'
      });
    }
    return columnDefs;
  }



  const [columnDefs, setColumnDefs] = useState<ColumnDef[]>([]);
  useEffect(() => {
    const columnDefs = getColumnDefs(props.columnDataType)
    setColumnDefs(columnDefs);
    console.log("Check", props.columnDataType);
  }, [props.columnDataType]);
  

  const source = `FROM bankdata
                  SELECT *`;
  const datasource = duckGridDataSource(db, source);

  const onModelUpdated = (params: any) => {
    datasource.getRows(params);
    // console.log("coldefs", params.api.getGridOption("columnDefs"));
  };

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  return (
    <div >
      <div style={{ height: "100%", boxSizing: "border-box" }}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowModelType="serverSide"
            serverSideDatasource={datasource}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            multiSortKey={"ctrl"}
            sideBar={true}
            serverSidePivotResultFieldSeparator="_"
            suppressAggFuncInHeader={true}
            onModelUpdated={onModelUpdated}
            onGridReady={onGridReady}
            rowHeight={25}
          />
        </div>
      </div>
    </div>
  );
};

export default StdAgGrid;
