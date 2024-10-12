import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./style.css";

interface AnnouncementHeaderProps {
  message: React.ReactNode;
  darkMode: boolean;
}

const AnnouncementHeader: React.FC<AnnouncementHeaderProps> = ({
  message,
  darkMode,
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Box
      className={`announcement-header ${darkMode ? "dark" : "light"}`}
      sx={{
        width: "100%",
        backgroundColor: "#f5f5f5",
        padding: "10px 20px",
        borderBottom: "1px solid #ddd",
        textAlign: "center",
      }}
    >
      <Typography variant="h6" component="div" sx={{ whiteSpace: "pre-line" }}>
        {message}
        <IconButton
          className="close-button"
          onClick={() => setVisible(false)}
          sx={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <CloseIcon />
        </IconButton>
      </Typography>
    </Box>
  );
};

export default AnnouncementHeader;
