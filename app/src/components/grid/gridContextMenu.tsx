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
      filterModel[params.column.getColId()] = {
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