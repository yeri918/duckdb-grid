import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const StdAgGrid = () => {

    const rowData = [
        { id: 1, name: 'John Doe', age: 25, city: 'New York' },
        { id: 2, name: 'Jane Smith', age: 30, city: 'Los Angeles' },
        { id: 3, name: 'Mike Johnson', age: 35, city: 'Chicago' },
        { id: 4, name: 'Sarah Williams', age: 28, city: 'San Francisco' },
        { id: 5, name: 'David Brown', age: 32, city: 'Seattle' },
    ];
    
    const columnDefs = [
        { headerName: 'ID', field: 'id' },
        { headerName: 'Name', field: 'name' },
        { headerName: 'Age', field: 'age' },
        { headerName: 'City', field: 'city' },
    ];

    return (
        <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
            />
        </div>
    );
};

export default StdAgGrid;


