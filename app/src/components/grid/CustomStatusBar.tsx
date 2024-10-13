import { CustomStatusPanelProps } from "@ag-grid-community/react";
import db from "../../duckDB";
import React, { useEffect, useState } from "react";
import {
  FilterModel,
  SingleFilterModel,
  MultiFilterModel,
} from "./interface/GridInterface";
// import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

interface CountBarProps extends CustomStatusPanelProps {
  tableName: string | null;
}

const CustomCountBar = (props: CountBarProps) => {
  const [count, setCount] = useState<number>(0); // Note not to use bigint

  const fetchData = async (tableName: string | null) => {
    const connection = await db.connect();
    const arrowResult = await connection.query(`
        SELECT count(*) as c FROM ${tableName};
    `);

    const result = arrowResult.toArray().map((row) => row.toJSON());
    await connection.close();
    // console.log("leudom check data");
    return Number(result[0].c);
  };

  useEffect(() => {
    const handleModelUpdated = () => {
      fetchData(props.tableName).then((data) => {
        setCount(data);
      });
    };

    // List of all events
    // https://www.ag-grid.com/javascript-data-grid/grid-events/
    props.api.addEventListener("firstDataRendered", handleModelUpdated);
    return () => {
      props.api.removeEventListener("firstDataRendered", handleModelUpdated);
    };
  }, []);

  return (
    <div className="ag-status-name-value">
      <span className="component">Row Count: &nbsp;</span>
      <span className="ag-status-name-value-value">
        {count.toLocaleString()}
      </span>
    </div>
  );
};

export const CustomFilterModelBar = (props: CustomStatusPanelProps) => {
  const [filterArray, setFilterArray] = useState<string[]>([]);

  const parseEqualItem = (
    key: string,
    filterItem: SingleFilterModel | MultiFilterModel,
    filterArray: string[],
  ) => {
    if ("type" in filterItem) {
      // Thats a singleMultiModel
      if (filterItem.type === "equals") {
        filterArray.push(`${key} = ${filterItem.filter}`);
      } else if (filterItem.type === "greaterThanOrEqual") {
        filterArray.push(`${key} >= ${filterItem.filter}`);
      } else if (filterItem.type === "lessThan") {
        filterArray.push(`${key} < ${filterItem.filter}`);
      } else if (filterItem.type === "notContains") {
        filterArray.push(`${key} NOT LIKE %${filterItem.filter}%`);
      } else if (filterItem.type === "contains") {
        filterArray.push(`${key} LIKE %${filterItem.filter}%`);
      }
    } else {
      // Thats a multiFilterModel
      const multiFilter = filterItem as MultiFilterModel;
      const multiFilterArray: string[] = [];
      multiFilter.conditions.forEach((condition) => {
        if (condition.type === "equals") {
          multiFilterArray.push(`${key} = ${condition.filter}`);
        } else if (condition.type === "greaterThanOrEqual") {
          multiFilterArray.push(`${key} >= ${condition.filter}`);
        } else if (condition.type === "lessThan") {
          multiFilterArray.push(`${key} < ${condition.filter}`);
        } else {
          multiFilterArray.push(`${key} = ${condition.filter}`);
        }
      });
      filterArray.push(multiFilterArray.join(` ${multiFilter.operator} `));
    }
  };

  const parseSetItem = (
    key: string,
    filterItem: SingleFilterModel | MultiFilterModel,
    filterArray: string[],
  ) => {
    if ("values" in filterItem) {
      if (filterItem.values) {
        if (filterItem.values.length === 1) {
          filterArray.push(`${key} = ${filterItem.values[0]}`);
        } else if (filterItem.values.length > 1) {
          filterArray.push(`${key} IN ${filterItem.values.join(", ")}`);
        }
      }
    }
  };

  const parseFilterModel = (filterModel: FilterModel) => {
    const filterArray: string[] = [];
    Object.keys(filterModel).forEach((key) => {
      const filterItem = filterModel[key];
      if ("filterType" in filterItem) {
        switch (filterItem.filterType) {
          case "number":
            parseEqualItem(key, filterItem, filterArray);
            break;
          case "multi":
            if (filterItem.filterModels !== undefined) {
              filterItem.filterModels.forEach((filterModel) => {
                if (filterModel !== null) {
                  switch (filterModel.filterType) {
                    case "text":
                      parseEqualItem(key, filterModel, filterArray);
                      break;
                    case "number": // Add case for "number" filter type
                      parseEqualItem(key, filterModel, filterArray);
                      break;
                    case "set":
                      parseSetItem(key, filterModel, filterArray);
                      break;
                  }
                }
              });
            }
        }
      }
    });
    console.log("check final", filterArray);
    return filterArray;
  };

  useEffect(() => {
    const fetchFilterModel = async () => {
      const filterModel = props.api.getFilterModel();
      if (filterModel === null || Object.keys(filterModel).length === 0) {
        setFilterArray([]);
      } else {
        const parsedFilterModel = parseFilterModel(filterModel);
        setFilterArray(parsedFilterModel);
      }
    };

    const handleFilterChanged = () => {
      // To be added more functions below if needed
      fetchFilterModel();
    };

    props.api.addEventListener("filterChanged", handleFilterChanged);
    return () => {
      try {
        props.api.removeEventListener("filterChanged", handleFilterChanged);
      } catch (e) {
        console.log("Error removing filterChanged event listener", e);
      }
    };
  }, []);

  return filterArray.length === 0 ? (
    <div></div>
  ) : (
    <div className="ag-status-name-value">
      <span className="component">Filters: &nbsp;</span>
      {filterArray.map((filter, index) => (
        <React.Fragment key={index}>
          <span className="ag-status-name-value-value">{filter}</span>
          {index !== filterArray.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};

export const CustomWaterMarkBar = () => {
  return (
    <div className="ag-status-name-value">
      <span className="component">Powered by DuckDB</span>
    </div>
  );
};

export default CustomCountBar;
