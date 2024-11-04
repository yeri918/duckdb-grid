import { IServerSideGetRowsParams } from "ag-grid-community";

interface FilterItem {
  filter: string;
  filterType: string;
  type: string;
  conditions: FilterItem[];
  filterModels?: FilterItem[];
  values?: string[];
}

const buildWhere = async (params: IServerSideGetRowsParams) => {
  const rowGroupCols = params.request?.rowGroupCols;
  const groupKeys = params.request?.groupKeys;
  const filterModel = params.request?.filterModel;
  const whereParts: string[] = [];

  // *****************************************************************
  // Main Function that creates SQL corresponding to ag-grid.
  // 1. TextFilter
  // 2. NumberFilter
  // 3. SetValue Filter
  // 4. MultiFilter ()
  // *****************************************************************
  const createFilterSql = (
    key: string,
    item: FilterItem,
  ): string | undefined => {
    switch (item.filterType) {
      case "text":
        return createTextFilterSql(key, item);
      case "number":
        return createNumberFilterSql(key, item);
      case "set":
        return createSetFilterSql(key, item);
      case "multi":
        return createMultiFilterSql(key, item.filterModels);
      default:
        console.log("Unknown filter type: ", item.filterType);
    }
  };

  const createMultiFilterSql = (
    key: string,
    item: FilterItem[] | undefined,
  ) => {
    if (item) {
      const localFilterSql: (string | undefined)[] = [];

      item.forEach((filterItem: FilterItem | undefined) => {
        if (filterItem) {
          localFilterSql.push(createFilterSql(key, filterItem));
        }
      });
      return localFilterSql.join(" OR ");
    }
  };

  const createSetFilterSql = (key: string, item: FilterItem) => {
    if (item.values) {
      if (item.values.length > 0) {
        const setValueSql = item.values.map((value) => {
          return `'${value}'`; // Add backticks to each value
        });
        return `"${key}" IN (${setValueSql.join(",")})`;
      } else {
        return `1 != 1`; // Make the grid empty when no set is chosen.
      }
    }
  };

  const createSingleNumberFilterSql = (
    key: string,
    item: FilterItem,
  ): string => {
    switch (item.type) {
      case "equals":
        return `"${key}" = ${item.filter}`;
      case "notEqual":
        return `"${key}" != ${item.filter}`;
      case "greaterThan":
        return `"${key}" > ${item.filter}`;
      case "greaterThanOrEqual":
        return `"${key}" >= ${item.filter}`;
      case "lessThan":
        return `"${key}" < ${item.filter}`;
      case "lessThanOrEqual":
        return `"${key}" <= ${item.filter}`;
      case "inRange":
        return `"${key}" BETWEEN ${item.filter}`;
      default:
        console.log("Unknown number filter type: ", item.type);
        return "";
    }
  };

  const createNumberFilterSql = (
    key: string,
    item: FilterItem,
  ): string | undefined => {
    if (item.type !== undefined) {
      return createSingleNumberFilterSql(key, item);
    }
    if (item.conditions) {
      const conditions = item.conditions;
      const filterSqls = conditions.map((condition) => {
        return createSingleNumberFilterSql(key, condition);
      });
      return filterSqls.join(" AND ");
    }
  };

  const createTextFilterSql = (
    key: string,
    item: FilterItem,
  ): string | undefined => {
    switch (item.type) {
      case "equals":
        return `"${key}" = '${item.filter}'`;
      case "notEqual":
        return `"${key}" != '${item.filter}'`;
      case "contains":
        return `"${key}" LIKE '%${item.filter}%'`;
      case "notContains":
        return `"${key}" NOT LIKE '%${item.filter}%'`;
      case "startsWith":
        return `"${key}" LIKE '${item.filter}%'`;
      case "endsWith":
        return `"${key}" LIKE '%${item.filter}'`;
      default:
        console.log("Unknown text filter type: ", item.type);
    }
  };

  if (groupKeys?.length > 0) {
    groupKeys.forEach((key, index) => {
      const colName = rowGroupCols[index].id;
      whereParts.push(`"${colName}" = '${key}'`);
    });
  }

  if (filterModel) {
    Object.keys(filterModel).forEach((key) => {
      const item = (filterModel as { [key: string]: FilterItem })[key]; // This is used to avoid creating new interface.

      const filterSql = createFilterSql(key, item);
      if (filterSql) {
        whereParts.push(filterSql);
      }
    });
  }

  if (whereParts?.length > 0) {
    return "WHERE " + whereParts.join(" AND ");
  } else {
    return "";
  }
};

export default buildWhere;
