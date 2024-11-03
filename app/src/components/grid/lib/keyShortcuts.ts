import { GridApi } from "ag-grid-enterprise";
import React from "react";

/**
 * Handles keyboard shortcuts for the grid component.
 *
 * Supported shortcuts:
 * - `Ctrl + F + Ctrl + C`: Clears the filter model and triggers the filter changed event if the `ctrlFDown` flag is active.
 *
 * @param event - The keyboard event object.
 * @param gridApi - The Grid API instance from ag-grid.
 * @param ctrlFDown - A mutable reference object to track the state of the Ctrl + F key combination.
 */
const handleKeyDown = (
  event: KeyboardEvent,
  gridApi: GridApi,
  ctrlFDown: React.MutableRefObject<boolean>,
) => {
  const noTriggeredRef = { current: true };

  const handleCtrlFAndC = (
    event: KeyboardEvent,
    gridApi: GridApi,
    ctrlFDown: React.MutableRefObject<boolean>,
    noTriggered: React.MutableRefObject<boolean>,
  ) => {
    if (event.ctrlKey && event.key === "f") {
      ctrlFDown.current = true;
      noTriggered.current = false;
      return;
    }

    if (ctrlFDown.current && event.key === "c") {
      noTriggered.current = false;
      gridApi?.setFilterModel(null);
      gridApi?.onFilterChanged();

      // This is added because some calls give a null filter.
      if (gridApi) {
        ctrlFDown.current = false;
      }
    }
  };

  handleCtrlFAndC(event, gridApi, ctrlFDown, noTriggeredRef);

  // Only update when false is true
  if (gridApi && noTriggeredRef.current) {
    ctrlFDown.current = false;
  }
};

export default handleKeyDown;
