import { useEffect, useState, useRef } from "react";
import * as React from "react";

import db from "./duckDB";

import AnnouncementHeader from "./components/header/AnnouncementHeader";
import StdAgGrid from "./components/grid/StdGrid";

import {
  Tabs,
  Tab,
  Box,
  IconButton,
  ThemeProvider,
  createTheme,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import { initParquetTable } from "./lib/example/initTable";
import { IoInvertMode } from "react-icons/io5";
import { tableFromArrays } from "apache-arrow";
import {
  convertDataTypes,
  loadCSVFile,
  loadParquet,
  loadXLSXFile,
} from "./lib/fileUtil";

import "react-tabs/style/react-tabs.css";
import "./App.css";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  height: string | number;
  width: string | number;
  style?: React.CSSProperties;
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

/* 
  ------------START OF USER EDITABLE AREA------------
  Go through the README below to setup the table.
*/
function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, height, width, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      className={`tab-panel${value !== index ? "-hidden" : ""}`}
      style={{ backgroundColor: "inherit" }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, height: height || "auto", width: width || "auto" }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface gridTab {
  label: string;
  content: JSX.Element;
}

function App() {
  const [tabData, setTabData] = useState<gridTab[]>([]);
  const [value, setValue] = React.useState(1); // Initial state of the tabs
  const [monoValue, setMonoValue] = React.useState(1);
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

  // Tabs init
  useEffect(() => {
    const tabData = [
      {
        label: "0 - Sample",
        content: (
          <StdAgGrid tabName="Tab1" darkMode={darkMode} tableName="penguins" />
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

  // render Tabs Functions
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }
  const onClickAddTab = () => {
    fileInputRef.current?.click();
  };

  // eslint-disable-next-line
  const handleAddTab = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target.files?.[0];
    const newIndex = tabData.length;
    const tableName = `table${newIndex + 1}`;
    console.log("leudom", file);

    // Reset the input value to allow getting the same file
    event.target.value = "";

    // Only action if file exists
    if (file && file.name.endsWith(".csv")) {
      loadCSVFile(file).then(async (data) => {
        // Convert data to Arrow Table
        // eslint-disable-next-line
        const convertedData = convertDataTypes(data as Record<string, any[]>);
        const table = tableFromArrays(convertedData);

        const c = await db.connect();
        await c.insertArrowTable(table, {
          name: `${tableName}`,
          create: true,
        });
        await c.query(`DESCRIBE ${tableName}`);
        await c.close();

        // Create new tab with the new table
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
        setValue(newIndex + 1);
        setMonoValue((prev) => prev + 1);
      });
    } else if (file && file.name.endsWith(".xlsx")) {
      loadXLSXFile(file).then(async (data) => {
        const table = tableFromArrays(
          data as Record<string, (string | number)[]>,
        );

        const c = await db.connect();
        await c.insertArrowTable(table, {
          name: `${tableName}`,
          create: true,
        });
        await c.query(`DESCRIBE ${tableName}`);
        await c.close();

        // Create new tab with the new table
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
        setValue(newIndex + 1);
        setMonoValue((prev) => prev + 1);
      });
    } else if (file && file.name.endsWith(".parquet")) {
      await loadParquet(file, tableName);

      const c = await db.connect();
      await c.query(`
          CREATE OR REPLACE TABLE ${tableName} AS
          SELECT * FROM 'local.parquet'
          `);
      await c.close();

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
      setValue(newIndex + 1);
      setMonoValue((prev) => prev + 1);
    }
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

  function renderTabs() {
    return (
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="basic tabs example"
      >
        <Tooltip title="Import an Excel or CSV file" arrow>
          <IconButton
            onClick={onClickAddTab}
            aria-label="add tab"
            style={{
              height: "40px",
              outline: "none",
              marginTop: "5px",
            }}
          >
            <AddIcon style={{ color: darkMode ? "white" : "gray" }} />
          </IconButton>
        </Tooltip>
        {tabData.map((tab, index) => (
          <Tab
            key={index}
            style={{ outline: "none" }}
            label={
              <div>
                {tab.label}
                <Tooltip title="Close tab" arrow>
                  <IconButton
                    style={{
                      color: darkMode ? "white" : "gray",
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
            }
            {...a11yProps(index)}
          />
        ))}
      </Tabs>
    );
  }

  function renderTabPanels() {
    return tabData.map((tab, index) => (
      <CustomTabPanel
        key={index} // The id to be identified
        value={value} // The current tab selected
        index={index + 1} // The position of the tab in the array
        height={"90%"}
        width={"95%"}
      >
        <div style={{ marginTop: -20, height: "100%" }}>{tab.content}</div>
      </CustomTabPanel>
    ));
  }

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
              👋 Welcome! Click the + button to import any CSV or Excel files to
              get started.
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
        <div
          className="top-right"
          style={{
            textAlign: "right",
            margin: "0px 10px -50px auto",
          }}
        >
          <div
            style={{
              fontSize: "25px",
              height: "40px",
              display: "inline-block",
            }}
          >
            <IoInvertMode onClick={toggleDarkMode} />
          </div>
        </div>
        <h1 className="app-title">Standard Grid</h1>
        <div>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              border: "1px solid gray",
              borderRadius: "10px",
              // padding: "10px",
              margin: "0px auto 40px auto",
              width: "90%",
            }}
          >
            <Box
              sx={{
                borderBottom: 0.5,
                borderColor: darkMode ? "divider" : "gray",
              }}
            >
              {renderTabs()}
            </Box>
            {renderTabPanels()}
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
}

export default App;
