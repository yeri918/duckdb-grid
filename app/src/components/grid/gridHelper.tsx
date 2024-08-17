import { ColumnDataType, ColumnDef } from './gridTypes';
import { Column, RowClassParams } from "ag-grid-enterprise";

export const getColumnDefs = (columnDataType: ColumnDataType) => {
    const columnDefs: ColumnDef[] = [];
    for (const key in columnDataType) {
      let columnDef: ColumnDef = {
        headerName: key,
        field: key,
        enableRowGroup: true,
        enableValue: true,
        filter: 'agTextColumnFilter'
      };
      
      if ( ["INTEGER", "DOUBLE", "FLAOT"].includes(columnDataType[key])) {
        columnDef.valueFormatter = (params) => {
          return new Intl.NumberFormat().format(params.value);
        };
      }
      columnDefs.push(columnDef);
    }
    return columnDefs;
  }