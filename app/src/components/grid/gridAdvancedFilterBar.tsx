// AdvancedFilterBar.tsx
import React from "react";
import { Box, TextField, Button } from "@mui/material";

interface AdvancedFilterBarProps {
  onFilterChange: (filter: string) => void;
}

const AdvancedFilterBar: React.FC<AdvancedFilterBarProps> = ({
  onFilterChange,
}) => {
  const [filter, setFilter] = React.useState("");

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  };

  const applyFilter = () => {
    onFilterChange(filter);
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
        onChange={handleFilterChange}
        sx={{ mr: 2, width: "100%" }}
      />
      <Button variant="contained" color="primary" onClick={applyFilter}>
        Apply
      </Button>
    </Box>
  );
};

export default AdvancedFilterBar;
