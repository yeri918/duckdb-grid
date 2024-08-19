import { GridApi } from 'ag-grid-community';
import { ContextMenuItem } from './gridTypes';

// region: Filters
export const onFilterEqual = (gridApi: GridApi, params: any): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    "name": "Filter equal",
    action: () => {

      let filterModel = gridApi.getFilterModel();
      filterModel = filterModel === undefined ? {} : filterModel

      const selectedValue = params.value;
      let filterColumn = params.column.getColId();

      // Additional logic so that use can filter on the group columns.
      if (filterColumn === "ag-Grid-AutoColumn") {
        filterColumn = gridApi.getRowGroupColumns()[params.node.level]
          .getColDef()
          .field
      }
      filterModel[filterColumn] = {
        type: "equals",
        filter: selectedValue
      }
      gridApi.setFilterModel(filterModel);
      gridApi.onFilterChanged();
    }
  }
  return menuItem
};

export const onFilterReset = (gridApi: GridApi, params: any): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    "name": "Clear all filters",
    action: () => {
      gridApi.setFilterModel(null);
      gridApi.onFilterChanged();
    }
  }
  return menuItem
};

// region: RowGroup
export const onRowGroupCollapseAll = (gridApi: GridApi, params: any): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    name: "Collapse all",
    action: () => {
      gridApi?.collapseAll();
    }
  }
  return menuItem
}

export const onRowGroupExpandOneLevel = (gridApi: GridApi, params: any): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    name: "Expand one level",
    action: () => {
      gridApi?.forEachNode((node: any) => {
        if (node.level === 0) {
          node.setExpanded(true);
        } else {
          node.setExpanded(false);
        }
      })
    }
  }
  return menuItem
}
// endregion


// region: chargin
export const onChartSelectedCells = (gridApi: GridApi, params: any): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    name: "Chart selected cells",
    action: () => {
      if (params.column.getColDef().chartDataType === 'category') {
        return;
      }
      const cellRange = gridApi.getCellRanges();
      // const selectedData = selectedNodes.map(node => node.data);
      //   rowStartIndex: selectedNodes[0].rowIndex,
      //   rowEndIndex: selectedNodes[selectedNodes.length - 1].rowIndex,
      //   columnStart: params.column,
      //   columnEnd: params.column
      // };
      console.log("hihihi", cellRange)

      const chartRangeParams = {
        cellRange: cellRange && cellRange[0], // Add null check
        chartType: 'line'
      };

      params.api.createRangeChart(chartRangeParams);
    }
  }
  return menuItem;
}// endregion