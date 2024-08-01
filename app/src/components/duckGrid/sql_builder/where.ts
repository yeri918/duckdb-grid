import {
    IServerSideDatasource,
    IServerSideGetRowsParams,
} from "ag-grid-community";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

interface FilterItem {
    filter: string;
    filterType: string;
    type: string;
}

const buildWhere = async (
    database: AsyncDuckDB,
    params: IServerSideGetRowsParams,
) => {
    const rowGroupCols = params.request?.rowGroupCols;
    const groupKeys = params.request?.groupKeys;
    const filterModel = params.request?.filterModel;

    const whereParts: string[] = [];

    const createFilterSql = (key: string, item: FilterItem) => {
        switch (item.filterType) {
            case "text":
                return createTextFilterSql(key, item);
            case "number":
                return createNumberFilterSql(key, item);
            default:
                console.log("Unknown filter type: ", item.filterType);
        }
    };

    const createNumberFilterSql = (key: string, item: FilterItem) => {
        switch (item.type) {
            case "equals":
                return `${key} = ${item.filter}`;
            case "notEqual":
                return `${key} != ${item.filter}`;
            case "greaterThan":
                return `${key} > ${item.filter}`;
            case "greaterThanOrEqual":
                return `${key} >= ${item.filter}`;
            case "lessThan":
                return `${key} < ${item.filter}`;
            case "lessThanOrEqual":
                return `${key} <= ${item.filter}`;
            case "inRange":
                return `${key} BETWEEN ${item.filter}`;
            default:
                console.log("Unknown number filter type: ", item.type);
        }
    };

    const createTextFilterSql = (key: string, item: FilterItem) => {
        switch (item.type) {
            case "equals":
                return `${key} = '${item.filter}'`;
            case "notEqual":
                return `${key} != '${item.filter}'`;
            case "contains":
                return `${key} LIKE '%${item.filter}%'`;
            case "notContains":
                return `${key} NOT LIKE '%${item.filter}%'`;
            case "startsWith":
                return `${key} LIKE '${item.filter}%'`;
            case "endsWith":
                return `${key} LIKE '%${item.filter}'`;
            default:
                console.log("Unknown text filter type: ", item.type);
        }
    };

    if (groupKeys.length > 0) {
        groupKeys.forEach((key, index) => {
            const colName = rowGroupCols[index].id;
            whereParts.push(`${colName} = '${key}'`);
        });
    };

    if (filterModel) {
        Object.keys(filterModel).forEach((key) => {
            const item = (filterModel as { [key: string]: FilterItem })[key]; // This is used to avoid creating new interface.
            const filterSql = createFilterSql(key, item);
            if (filterSql) {
                whereParts.push(filterSql);
            }
        });
    };

    if (whereParts.length > 0) {
        return "WHERE " + whereParts.join(" AND ");
    } else {
        return "";
    };
};

export default buildWhere;
