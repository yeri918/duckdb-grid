import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import createServerSideDatasource from "../duckdb/datasource";
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
    { headerName: "Value", field: "Value", enableValue: true, aggFunc: "sum" },
    {
      headerName: "Transaction_count",
      field: "Transaction_count",
      enableValue: true,
    },
    { headerName: "rn", field: "rn", enableValue: true, aggFunc: "sum" },
  ]);

  const source = `FROM bankdata
                  SELECT *, row_number() over () as rn `;
  const datasource = createServerSideDatasource(duckdb, source);
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
            sideBar={true}
          />
        </div>
      </div>
    </div>
  );
};

export default StdAgGrid;
