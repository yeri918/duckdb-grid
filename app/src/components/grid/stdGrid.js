import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';


const StdAgGrid = () => {
    const [rowData, setRowData] = useState(null);
    const [aggFunc, setAggFunc] = useState('sum'); // Add this line
    const [gridApi, setGridApi] = useState(null);
    
    useEffect(() => {
        async function fetchData() {
            const response = await fetch("/bankdataset.csv");
            const reader = response.body.getReader();
            const result = await reader.read(); // raw array
            const decoder = new TextDecoder("utf-8");
            const csv = decoder.decode(result.value); // the csv text
            const results = Papa.parse(csv, { 
                header: true, 
                delimiter: ',',
                transform: (value, header) => {
                    if (header === 'Value' || header === 'Transaction_count') {
                        return parseFloat(value);
                    }
                    return value;
                } 
            }); // object with { data, errors, meta }
            const rows = results.data; // array of objects
            console.log(rows.length);
            console.log(rows);
            setRowData(rows);
        }
        fetchData();
    }, []);



    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '1000px', width: '100%' }), []);

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


    const [columnDefs, seColumnDefs] = useState([
        { headerName: 'Domain', field: 'Domain', enableRowGroup: true, enableValue: true },
        { headerName: 'Date', field: 'Date', enableRowGroup: true, enableValue: true },
        { headerName: 'Location', field: 'Location', enableRowGroup: true, enableValue: true },
        { headerName: 'Value', field: 'Value', 
                    enableValue: true, 
                    aggFunc: "sum"},
        { headerName: 'Transaction_count', field: 'Transaction_count', 
                    enableValue: true,  
                    // Trying to use custom function here (same as sum)
                    }
    ], []);
   

    return (
        <div style={containerStyle}>
            <div style={{ height: '100%', boxSizing: 'border-box' }}>
                <div 
                    style={gridStyle}
                    className="ag-theme-alpine" 
                >
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        // defaultColDef={defaultColDef}
                        // auto ColumnDef={autoGroupColumnDef}
                        sideBar={true}
                    />
                </div>
            </div>
        </div>
        
    );
};

export default StdAgGrid;