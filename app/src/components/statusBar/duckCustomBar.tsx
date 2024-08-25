import { CustomStatusPanelProps } from "@ag-grid-community/react";
import db from "../table/duckDB";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import React, { useEffect, useState } from "react";
import {
  FilterModel,
  SingleFilterModel,
  MultiFilterModel,
} from "../grid/gridTypes";
// import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

const CustomCountBar = (props: CustomStatusPanelProps) => {
  const [count, setCount] = useState<number>(0); // Note not to use bigint

  const fetchData = async () => {
    const connection = await db.connect();
    const arrowResult = await connection.query(`
        SELECT count(*) as c FROM bankdata
    `);

    const result = arrowResult.toArray().map((row) => row.toJSON());
    await connection.close();
    return Number(result[0].c);
  };

  useEffect(() => {
    const handleModelUpdated = () => {
      fetchData().then((data) => {
        setCount(data);
      });
    };

    // List of all events
    // https://www.ag-grid.com/javascript-data-grid/grid-events/
    props.api.addEventListener("modelUpdated", handleModelUpdated);
    return () => {
      props.api.removeEventListener("modelUpdated", handleModelUpdated);
    };
  }, []);

  return (
    <div className="ag-status-name-value">
      <span className="component">Row Count: &nbsp;</span>
      <span className="ag-status-name-value-value">{count}</span>
    </div>
  );
};

export const CustomFilterModelBar = (props: CustomStatusPanelProps) => {
  const [filterArray, setFilterArray] = useState<string[]>([]);

  const parseFilterModel = (filterModel: FilterModel) => {
    let filterArray: string[] = [];
    Object.keys(filterModel).forEach((key) => {
      const filterItem = filterModel[key];
      if ("type" in filterItem) {
        // Thats a singleMultiModel
        if (filterItem.type === "equals") {
          filterArray.push(`${key} = ${filterItem.filter}`);
        } else if (filterItem.type === "greaterThanOrEqual") {
          filterArray.push(`${key} >= ${filterItem.filter}`);
        } else if (filterItem.type === "lessThan") {
          filterArray.push(`${key} < ${filterItem.filter}`);
        } else {
          filterArray.push(`${key} = ${filterItem.filter}`);
        }
      } else {
        // Thats a multiFilterModel
        let multiFilter = filterItem as MultiFilterModel;
        let multiFilterArray: string[] = [];
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
        console.log("check", multiFilterArray);
        filterArray.push(multiFilterArray.join(` ${multiFilter.operator} `));
      }
    });
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
      console.log("FilterCheck", props.api.getFilterModel());
    };

    const handleFilterChanged = () => {
      // To be added more functions below if needed
      fetchFilterModel();
    };

    props.api.addEventListener("filterChanged", handleFilterChanged);
    return () => {
      props.api.removeEventListener("filterChanged", handleFilterChanged);
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

export default CustomCountBar;
