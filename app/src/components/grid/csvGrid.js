import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import StdAgGrid from './stdGrid';






const CsvAgGrid = () => {
    const [rowData, setRowData] = useState(null);
    console.log("Hi")
    
    useEffect(() => {
        async function fetchData() {
            const response = await fetch("/bankdataset.csv");
            const reader = response.body.getReader();
            const result = await reader.read(); // raw array
            const decoder = new TextDecoder("utf-8");
            const csv = decoder.decode(result.value); // the csv text
            const results = Papa.parse(csv, { header: true, delimiter: ',' }); // object with { data, errors, meta }
            const rows = results.data; // array of objects
            setRowData(rows);
        }
        fetchData();
    }, []);

    useEffect(() => {
        console.log(rowData);
    }, [rowData]);

    const columnDefs = [
        { headerName: 'Date', field: 'Date', rowGroup: true },
        { headerName: 'Domain', field: 'Domain', rowGroup: true },
        { headerName: 'Location', field: 'Location', rowGroup: true },
        { headerName: 'Value', field: 'Value', enableValue: true },
        { headerName: 'Transaction_count', field: 'Transaction_count' }
    ];

    return <StdAgGrid rowData={rowData} columnDefs={columnDefs} />;
};

export default CsvAgGrid;