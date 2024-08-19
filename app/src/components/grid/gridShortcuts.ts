import { GridApi } from "ag-grid-enterprise";
import React, { useRef } from "react"

const handleKeyDown = (event: KeyboardEvent, gridApi: GridApi,
  ctrlFDown: React.MutableRefObject<boolean>) => {

  let noTriggered = true;
  // region: New Data
  if (event.ctrlKey && event.key === "e") {
    noTriggered = false;
    gridApi?.setFilterModel({
      ["today_location"]: {
        type: "equals",
        filter: "Bhuj"
      }
    });
    gridApi?.onFilterChanged();
  }
  // endregion

  if (event.ctrlKey && event.key === "f") {
    ctrlFDown.current = true;
    noTriggered = false;
    return
  }

  if (ctrlFDown.current && event.key === "c") {

    noTriggered = false;
    gridApi?.setFilterModel(null);
    gridApi?.onFilterChanged();

    // This is added because some calls give a null filter.
    if (gridApi) {
      ctrlFDown.current = false;
    }
  }
  // endregion

  // region: Group By Shortcuts
  if (event.ctrlKey && event.key === "ArrowRight") {
    // Code for Ctrl + S shortcut
    noTriggered = false;

    // Record Maximum NodeLevel
    let maxLevel = -1;
    gridApi?.forEachNode((node: any) => {
      if (node.level > maxLevel && node.displayed === true && node.expanded === true) {
        maxLevel = node.level
      }
    });
    console.log("check group", maxLevel);

    gridApi?.forEachNode((node: any) => {
      if (node.level <= maxLevel + 1) {
        node.setExpanded(true);
      } else {
        node.setExpanded(false);
      }
    });
  }

  if (event.ctrlKey && event.key === "ArrowLeft") {
    // Code for Ctrl + S shortcut
    noTriggered = false;

    // Record Maximum NodeLevel
    let maxLevel = -1;
    gridApi?.forEachNode((node: any) => {
      if (node.level > maxLevel && node.displayed === true) {
        console.log("hihi", node.level, node);
        maxLevel = node.level
      }
    });
    console.log("check group left", maxLevel, "reduced to", maxLevel - 1);

    gridApi?.forEachNode((node: any) => {
      if (node.level === maxLevel - 1) {

        node.setExpanded(false);
        if (node.level > maxLevel) {
          node.level = maxLevel
        }
      } else {
        node.setExpanded(true);
      }
    });
  }

  // Reset the flags
  // Only update when false is tru.
  if (gridApi && noTriggered) {
    ctrlFDown.current = false;
  }


  // endregion
};

export default handleKeyDown