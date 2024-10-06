// AdvancedFilterBar.tsx
import React from "react";
import { Box, TextField, Button, Tooltip } from "@mui/material";
import { GridApi } from "ag-grid-community";

interface AdvancedFilterBarProps {
  gridApi: GridApi;
  darkMode: boolean | null;
  success: boolean; // indicates whether duckgrid had failure executing with advanced filters
}

const BLUE_COLOR = "#2196F3";
const INPROGRESS_COLOR = "#dd33fa";
const FAILED_COLOR = "#f6685e";
const AdvancedFilterBar: React.FC<AdvancedFilterBarProps> = ({
  gridApi,
  darkMode,
  success,
}) => {
  const [filter, setFilter] = React.useState("");
  const [enter, setEnter] = React.useState(false);

  const applyFilter = () => {
    gridApi.setGridOption("context", { advancedFilter: filter });
    // gridApi.onFilterChanged();
    gridApi.refreshServerSide();
    gridApi.refreshCells();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      setEnter(true);

      applyFilter();
      setTimeout(() => {
        setEnter(false);
      }, 1000); // Filtering in progress signal for 1 second
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 0,
        width: "100%",
      }}
    >
      <TextField
        label={
          enter
            ? "Applying the filter..."
            : success
            ? "Enter a WHERE SQL Expression to filter results"
            : "Failed to filter"
        }
        variant="outlined"
        value={filter}
        onChange={(sql) => setFilter(sql.target.value)}
        onKeyDown={handleKeyDown}
        size="small"
        color="primary"
        sx={{
          mr: 2,
          width: "100%",
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: darkMode ? "white" : "#ccc", // Change border color
            },
            "&:hover fieldset": {
              borderColor: BLUE_COLOR, // Change border color on hover
            },
            "&.Mui-focused fieldset": {
              borderColor: enter
                ? INPROGRESS_COLOR
                : success
                ? darkMode
                  ? "white"
                  : BLUE_COLOR
                : FAILED_COLOR, // Change border color on focus based on enter
            },
          },
          "& .MuiInputBase-input": {
            color: darkMode ? "white" : "black", // Change input text color
          },
          "& .MuiInputLabel-root": {
            // fontSize: "13px", // Change label text font size
            color: enter ? INPROGRESS_COLOR : success ? "none" : FAILED_COLOR, // Change label text color based on enter and success
          },
        }}
      />
      <Tooltip title="ENTER to execute for shortcut." arrow>
        <Button variant="contained" color="primary" onClick={applyFilter}>
          Apply
        </Button>
      </Tooltip>
    </Box>
  );
};

export default AdvancedFilterBar;
