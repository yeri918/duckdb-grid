import { GridApi } from "ag-grid-enterprise";
import React, { useRef } from "react"

const handleKeyPressed = (event: KeyboardEvent, gridApi: GridApi,
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

  if (event.key === "esc") {
    // ctrlFDown = false
    console.log("ESC reset")
  }
  // endregion

  // region: Group By Shortcuts
  if (event.ctrlKey && event.key === "1") {
    // Code for Ctrl + S shortcut
    noTriggered = false;
    console.log("Ctrl + 1 shortcut triggered");
    gridApi?.forEachNode((node: any) => {
      if (node.level === 0) {
        node.setExpanded(true);
      } else {
        node.setExpanded(false);
      }
    });
    console.log("Ctrl + 1 shortcut triggered Done");
  }

  if (event.ctrlKey && event.key === "2") {
    // Code for Ctrl + S shortcut
    noTriggered = false;
    console.log("Ctrl + 2 shortcut triggered");
    gridApi?.forEachNode((node: any) => {
      if (node.level <= 1) {
        node.setExpanded(true);
      } else {
        node.setExpanded(false);
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

export default handleKeyPressed