import { useEffect, useState, useRef, useMemo, ReactNode } from "react";
import * as React from "react";

import db from "./duckDB";

import AnnouncementHeader from "./components/header/AnnouncementHeader";
import StdAgGrid from "./components/grid/StdGrid";
import Shell from "./components/shell/Shell";

import {
  Box,
  IconButton,
  ThemeProvider,
  createTheme,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import { initParquetTable } from "./lib/example/initTable";
import {
  IoInvertMode,
  IoLogoGithub,
  IoTerminalOutline,
  IoGameController,
} from "react-icons/io5";

import * as load from "./lib/load";

import "react-tabs/style/react-tabs.css";
import "./App.css";

import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

interface gridTab {
  label: string;
  content: JSX.Element;
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    background: {
      default: "#121212",
      paper: "#1d1d1d",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
  },
});

const App: React.FC = () => {
  const [tabData, setTabData] = useState<gridTab[]>([]);
  const [value, setValue] = React.useState(0);
  const [monoValue, setMonoValue] = React.useState(0);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* 
    README: Init Steps
  */
  initParquetTable("./penguins.parquet", "penguins");

  useEffect(() => {
    const userPrefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(userPrefersDark);
  }, []);

  useEffect(() => {
    const rootElement = document.getElementById("root");
    if (rootElement) {
      if (announcementVisible) {
        rootElement.classList.add("announcement-visible");
      } else {
        rootElement.classList.remove("announcement-visible");
      }
    }
  }, [announcementVisible]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Tabs init
  useEffect(() => {
    const tabData = [
      {
        label: "0 - Sample",
        content: (
          <StdAgGrid
            tabName="Tab1"
            tableName="penguins"
            darkMode={darkMode}
            controllerVisible={true}
          />
        ),
      },
    ];
    setTabData(tabData);
  }, []);

  // Dark Mode
  useEffect(() => {
    setTabData((prevTabData) =>
      prevTabData.map((tab) => ({
        ...tab,
        content: React.cloneElement(tab.content, { darkMode }),
      })),
    );
  }, [darkMode]);

  const onClickAddTab = () => {
    fileInputRef.current?.click();
  };

  // eslint-disable-next-line
  const handleAddTab = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target.files?.[0];
    const newIndex = tabData.length;
    const tableName = `table${newIndex + 1}`;

    // Reset the input value to allow getting the same file
    event.target.value = "";

    // Only action if file exists
    if (file) {
      if (file.name.endsWith(".csv")) {
        await load.CSV(file, tableName);
      } else if (file.name.endsWith(".xlsx")) {
        await load.Excel(file, tableName);
      } else if (file.name.endsWith(".parquet")) {
        await load.Parquet(file, tableName);
      }
      const newTab = {
        label: `${monoValue} - ${file.name}`, // Tab starts at 1, 0 is the plus button
        content: (
          <StdAgGrid
            tabName={`Tab${newIndex + 1}`}
            darkMode={darkMode}
            tableName={tableName}
          />
        ),
      };
      setTabData([...tabData, newTab]);
      setValue(tabData.length);
      setMonoValue((prev) => prev + 1);
    }
  };

  const onClickAddShell = () => {
    const newTab: gridTab = {
      label: `${monoValue} - shell`, // Tab starts at 1, 0 is the plus button
      content: <Shell />,
    };

    const newTabData = [...tabData, newTab];
    setTabData(newTabData);
    setValue(tabData.length + 2);
    setMonoValue((prev) => prev + 1);
  };

  const handleCloseTab = async (index: number) => {
    setTabData((prevTabData) => prevTabData.filter((_, i) => i !== index)); // filter out the index
    if (value >= index) {
      setValue((prevValue) => (prevValue === 0 ? 0 : prevValue - 1));
    }
    const c = await db.connect();
    await c.query(`
      DROP TABLE table${index + 1};
      `);
    await c.close();
  };

  const tabList = useMemo(
    () => (
      <TabList>
        <Tooltip title="Import an Excel, CSV, or Parquet file" arrow>
          <IconButton
            key="add-tab-button"
            onClick={onClickAddTab}
            aria-label="add tab"
            style={{
              height: "30px",
              outline: "none",
            }}
          >
            <AddIcon style={{ color: darkMode ? "white" : "gray" }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Open a duckdb shell" arrow>
          <IconButton
            key="add-icon-button"
            onClick={onClickAddShell}
            aria-label="add shell tab"
            style={{
              height: "30px",
              outline: "none",
            }}
          >
            <IoTerminalOutline style={{ color: darkMode ? "white" : "gray" }} />
          </IconButton>
        </Tooltip>

        {tabData.map((tab, index) => (
          <Tab key={index} style={{ outline: "none", paddingTop: 0 }}>
            <div style={{ margin: 0, padding: 0 }}>
              {tab.label}
              <Tooltip title="Close tab" arrow>
                <IconButton
                  style={{
                    color: "gray",
                    outline: "none",
                    borderRadius: "50%",
                    padding: "0px",
                    marginLeft: "10px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(index);
                  }}
                >
                  <CloseIcon style={{ fontSize: "20px" }} />
                </IconButton>
              </Tooltip>
            </div>
          </Tab>
        ))}
      </TabList>
    ),
    [tabData, darkMode],
  );
  const renderTabs = useMemo(() => {
    console.log("leudom value", value);
    return (
      <Tabs selectedIndex={value} onSelect={(index) => setValue(index)}>
        <Tabs selectedIndex={value} onSelect={(index) => setValue(index)}>
          {tabList}
          {tabData.map((tab, index) => (
            <TabPanel
              key={index}
              style={{
                height: "70vh", // Set height using vh units
              }}
            >
              {tab.content}
            </TabPanel>
          ))}
        </Tabs>
        {tabData.map((tab, index) => (
          <TabPanel
            key={index}
            style={{
              height: "70vh", // Set height using vh units
            }}
          >
            {tab.content}
          </TabPanel>
        ))}
      </Tabs>
    );
  }, [tabData, value]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleAnnouncementClose = () => {
    setAnnouncementVisible(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className={`app-container ${
          announcementVisible ? "announcement-visible" : ""
        }`}
      >
        <AnnouncementHeader
          darkMode={darkMode}
          message={
            <>
              👋 Welcome! Click the + button to import any CSV, Excel, or
              Parquet files to get started.
              <br />
              🔗 The grid is secure, running only in your browser. More info in{" "}
              <a
                href="https://github.com/yeri918/duckdb-grid"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: darkMode ? "#90caf9" : "#1976d2" }}
              >
                GitHub Page
              </a>
              .
            </>
          }
          onClose={handleAnnouncementClose}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 20px",
            backgroundColor: "#1d1d1d",
            color: "#ffffff",
            borderBottom: "1px solid #fff",
            position: "sticky",
            zIndex: 1000,
            top: 0,
          }}
        >
          <h1
            className="app-title"
            style={{ margin: 0, fontSize: "38px", padding: "5px" }}
          >
            DuckGrid
          </h1>
          <div
            style={{
              display: "inline-block",
              flex: 1,
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "25px",
                height: "40px",
                display: "inline-block",
                cursor: "pointer",
                marginTop: "5px",
              }}
            >
              <IoLogoGithub
                onClick={() =>
                  window.open(
                    "https://github.com/yeri918/duckdb-grid",
                    "_blank",
                  )
                }
                color="white"
              />
            </div>
            <div
              style={{
                fontSize: "25px",
                height: "40px",
                display: "inline-block",
                cursor: "pointer",
                marginLeft: "10px",
              }}
            >
              <IoInvertMode onClick={toggleDarkMode} />
            </div>
          </div>
        </Box>
        <div>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              border: "1px solid gray",
              borderRadius: "10px",
              margin: "30px auto",
              width: "90%",
            }}
          >
            <Box
              sx={{
                borderBottom: 0.5,
                borderColor: darkMode ? "divider" : "gray",
              }}
            >
              {renderTabs}
            </Box>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".csv,.xlsx,.parquet"
              onChange={handleAddTab}
            />
          </Box>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
