import { GridApi, Column } from "ag-grid-community";
import { ContextMenuItem } from "../interface/GridInterface";
import { ChartType } from "ag-grid-community";

// region: Filters
export const onFilterEqual = (
  gridApi: GridApi,
  params: any,
): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    name: "Filter equal",
    action: () => {
      let filterModel = gridApi.getFilterModel();

      filterModel = filterModel === undefined ? {} : filterModel;
      console.log("filter Model", filterModel);

      const selectedValue = params.value;
      let filterColumn = params.column.getColId();

      // Additional logic so that use can filter on the group columns.
      if (filterColumn === "ag-Grid-AutoColumn") {
        filterColumn = gridApi
          .getRowGroupColumns()
          [params.node.level].getColDef().field;
      }

      // Check the FilterType and create the filter model accordingly.
      const column: Column | null = gridApi.getColumn(filterColumn);
      console.log("columnFilter", column);
      if (column) {
        if ("colDef" in column) {
          const colDef = column.colDef as Column;
          if ("filter" in colDef) {
            // Switch based on Ag-Grid Filter Type
            switch (colDef.filter) {
              // agMultiColumnFilter
              case "agNumberColumnFilter":
                const lowerBound = Math.round(selectedValue);
                const upperBound = lowerBound + 1;
                filterModel[filterColumn] = {
                  filterType: "number",
                  operator: "AND",
                  conditions: [
                    {
                      type: "greaterThanOrEqual",
                      filter: lowerBound,
                    },
                    {
                      type: "lessThan",
                      filter: upperBound,
                    },
                  ],
                };
                break;
              case "agMultiColumnFilter":
                filterModel[filterColumn] = {
                  filterType: "multi",
                  filterModels: [
                    null, // This is same pattern as the ag-Grid filter model.
                    {
                      filterType: "set",
                      values: [selectedValue],
                    },
                  ],
                };
                break;
              case "agTextColumnFilter":
                filterModel[filterColumn] = {
                  filter: selectedValue,
                  filterType: "text",
                  type: "equals",
                };
                break;
            }
          }
        }
      }

      gridApi.setFilterModel(filterModel);
      gridApi.onFilterChanged();
    },
  };
  return menuItem;
};

export const onFilterReset = (
  gridApi: GridApi,
  params: any,
): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    name: "Clear all filters",
    action: () => {
      gridApi.setFilterModel(null);
      gridApi.onFilterChanged();
    },
  };
  return menuItem;
};

// region: RowGroup
export const onRowGroupCollapseAll = (
  gridApi: GridApi,
  params: any,
): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    name: "Collapse all",
    action: () => {
      gridApi?.collapseAll();
    },
  };
  return menuItem;
};

export const onRowGroupExpandOneLevel = (
  gridApi: GridApi,
  params: any,
): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    name: "Expand one level",
    action: () => {
      gridApi?.forEachNode((node: any) => {
        if (node.level === 0) {
          node.setExpanded(true);
        } else {
          node.setExpanded(false);
        }
      });
    },
  };
  return menuItem;
};
// endregion

// region: chargin
export const onChartSelectedCells = (
  gridApi: GridApi,
  params: any,
  chartType: ChartType = "line", // line, groupedColumn
): ContextMenuItem => {
  const menuItem: ContextMenuItem = {
    name: `Chart selected cells (${chartType})`,
    action: () => {
      // Sanity Check, return null if failed.
      if (params.column.getColDef().chartDataType === "category") {
        return;
      }
      const cellRange = gridApi.getCellRanges();
      if (cellRange === null) {
        return;
      }

      // Derive Start and End Row Index
      // Note: if start row = end row, we null it to plot the whole column.
      let rowStartIndex: number | undefined | null =
        cellRange[0].startRow?.rowIndex;
      let rowEndIndex: number | undefined | null =
        cellRange[0].endRow?.rowIndex;
      if (rowStartIndex === rowEndIndex) {
        rowStartIndex = rowEndIndex = null;
      }

      // Charting Params
      const chartRangeParams = {
        cellRange: {
          rowStartIndex: rowStartIndex,
          rowEndIndex: rowEndIndex,
          columns: cellRange[0].columns,
        },
        chartType: chartType,
        chartThemeOverrides: {
          common: {
            legend: {
              enabled: true,
              item: {
                label: {
                  formatter: (params: { itemId: any }) => {
                    if (params) {
                      return params.itemId;
                    }
                    return "";
                  },
                },
              },
            },
          },
        },
      };

      params.api.createRangeChart(chartRangeParams);
    },
  };
  return menuItem;
}; // endregion
