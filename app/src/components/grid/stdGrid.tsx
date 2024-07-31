import React, { useEffect, useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import duckGridDataSource from "../duckGrid/duckGridDS";
import duckdb from "../engine/duckdb";
interface RowData {
  [key: string]: string | number;
}

const StdAgGrid: React.FC = () => {
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

  const [columnDefs, setColumnDefs] = useState([
    {
      headerName: "Domain",
      field: "Domain",
      enableRowGroup: true,
      enableValue: true,
    },
    {
      headerName: "Date",
      field: "Date",
      enableRowGroup: true,
      enableValue: true,
    },
    {
      headerName: "Location",
      field: "Location",
      enableRowGroup: true,
      enableValue: true,
    },
    {
      headerName: "Value",
      field: "Value",
      enableValue: true,
      allowedAggFuncs: ["sum", "min", "max"],
    },
    {
      headerName: "Transaction_count",
      field: "Transaction_count",
      enableValue: true, 
      aggFunc: "sum"
    },
    { headerName: "rn", field: "rn", enableValue: true },
  ]);

  const source = `FROM bankdata
                  SELECT *, row_number() over () as rn `;
  const datasource = duckGridDataSource(duckdb, source);

  const onModelUpdated = (params: any) => {
    datasource.getRows(params);
    console.log("coldefs", params.api.getGridOption("columnDefs"));
  };

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };
  return (
    <div style={containerStyle}>
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
            onModelUpdated={onModelUpdated}
            onGridReady={onGridReady}
          />
        </div>
      </div>
    </div>
  );
};

export default StdAgGrid;
