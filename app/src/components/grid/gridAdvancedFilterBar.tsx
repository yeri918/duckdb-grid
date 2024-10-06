// AdvancedFilterBar.tsx
import React from "react";
import { Box, TextField, Button } from "@mui/material";
import { GridApi } from "ag-grid-community";

interface AdvancedFilterBarProps {
  gridApi: GridApi;
}

const AdvancedFilterBar: React.FC<AdvancedFilterBarProps> = ({ gridApi }) => {
  const [filter, setFilter] = React.useState("");

  const applyFilter = () => {
    gridApi.setGridOption("context", { advancedFilter: filter });
    console.log("leudom filter applied: ", filter);
    gridApi.onFilterChanged();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      applyFilter();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 2,
        width: "100%",
      }}
    >
      <TextField
        label="Enter a SQL Expression to filter results."
        variant="outlined"
        value={filter}
        onChange={(sql) => setFilter(sql.target.value)}
        onKeyDown={handleKeyDown}
        sx={{ mr: 2, width: "100%" }}
      />
      <Button variant="contained" color="primary" onClick={applyFilter}>
        Apply
      </Button>
    </Box>
  );
};

export default AdvancedFilterBar;
