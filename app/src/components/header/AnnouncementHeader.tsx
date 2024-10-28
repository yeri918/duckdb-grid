import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./AnnouncementHeader.css";

interface AnnouncementHeaderProps {
  message: React.ReactNode;
  darkMode: boolean;
  onClose: () => void;
}

const AnnouncementHeader: React.FC<AnnouncementHeaderProps> = ({
  message,
  darkMode,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Box
      className={`announcement-header ${darkMode ? "dark" : "light"}`}
      sx={{
        width: "100%",
        backgroundColor: "#f5f5f5",
        padding: "10px -20px",
        borderBottom: "1px solid #ddd",
        textAlign: "center",
      }}
    >
      <Typography variant="subtitle1" component="div" sx={{ whiteSpace: "pre-line" }}>
        {message}
        <IconButton
          className="close-button"
          onClick={() => {
            onClose();
            setVisible(false);
          }}
          sx={{
            position: "absolute",
            right: "50px",
            top: "50%",
            transform: "translateY(-50%)", // Used to center the element.
          }}
        >
          <CloseIcon />
        </IconButton>
      </Typography>
    </Box>
  );
};

export default AnnouncementHeader;
