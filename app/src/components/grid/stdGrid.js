import React, {useCallback, useMemo} from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';


const StdAgGrid = ({ rowData, columnDefs }) => {

    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '1000px', width: '100%' }), []);

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
                        sideBar={true}
                    />
                </div>
            </div>
        </div>
        
    );
};


export default StdAgGrid;



