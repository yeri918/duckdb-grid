import { useEffect, useState, useRef, useMemo } from "react";
import * as React from "react";
import {
  Tabs,
  Tab,
  Box,
  IconButton,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import "react-tabs/style/react-tabs.css";
import "./App.css";
import StdAgGrid from "./components/grid/stdGrid";
import AddIcon from "@mui/icons-material/Add";
import { ColumnDataType } from "./components/grid/gridTypes";
import InitUserTable, {
  InitParquetTable,
  InitS3ParquetTable,
} from "./components/table/initTable";
import { IoInvertMode } from "react-icons/io5";
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  height: string | number;
  width: string | number;
}

interface GridTable {
  table: string;
}

interface TableCatelog {
  [key: string]: GridTable;
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

function App() {
  const [ready, setReady] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const loadingFailedFlag = useRef<JSX.Element | null>(null);
  const [tabData, setTabData] = useState<any[]>([]);
  const [value, setValue] = React.useState(1); // Initial state of the tabs
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* 
    README: Init Steps
  */
  const failedFlag = InitParquetTable("./bankdataset.parquet");
  if (failedFlag !== null) {
    console.log("check failedFlag", failedFlag);
    loadingFailedFlag.current = failedFlag;
  }

  const [tableCatalog, setTableCatalog] = useState<TableCatelog>({});
  useEffect(() => {
    setTableCatalog({
      user: {
        table: "bankdataset",
      },
    });
  }, [loadingFailedFlag]);

  /* 
    README: Choose the table you want to initialize
  */
  // const table = InitUserTable();
  // const s3ParquetTable = InitS3ParquetTable();

  /* 
    ------------END OF USER EDITABLE AREA------------
  */

  useEffect(() => {
    const userPrefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDarkMode(userPrefersDark);
  }, []);

  useEffect(() => {
    setReady(true);
  }, [loadingFailedFlag]);

  // Init with two tabs
  useEffect(() => {
    const tabData = [
      {
        label: "Tab 1",
        content: <StdAgGrid tabName="Tab1" darkMode={darkMode} />,
      },
    ];
    setTabData(tabData);
  }, [loadingFailedFlag, darkMode]);

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
  // Add Tabs
  const handleAddTab = () => {
    // const handleAddTab = (event: React.ChangeEvent<HTMLInputElement>) => {
    // const file = event?.target.files?.[0];
    // if (file) {
    const newIndex = tabData.length;
    const newTab = {
      label: `Tab ${newIndex + 1}`, // Tab starts at 1, 0 is the plus button
      content: <StdAgGrid tabName={`Tab${newIndex + 1}`} darkMode={darkMode} />,
    };
    setTabData([...tabData, newTab]);
    setValue(newIndex + 1);
    // }
  };

  function renderTabs() {
    return (
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="basic tabs example"
      >
        <IconButton
          onClick={handleAddTab}
          // onClick={onClickAddTab}
          aria-label="add tab"
          style={{
            height: "40px",
            outline: "none",
            marginTop: "5px",
          }}
        >
          <AddIcon style={{ color: darkMode ? "white" : "gray" }} />
        </IconButton>
        {tabData.map((tab, index) => (
          <Tab
            style={{ outline: "none" }}
            label={tab.label}
            {...a11yProps(index)}
          />
        ))}
      </Tabs>
    );
  }

  function renderTabPanels() {
    return tabData.map((tab, index) => (
      <CustomTabPanel
        value={value}
        index={index + 1} // Value starts at 1. 0 is the add button
        height={"94%"}
        width={"95%"}
      >
        {tab.content}
      </CustomTabPanel>
    ));
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="app-container">
        <div
          className="top-right"
          style={{ position: "absolute", top: "10px", right: "10px" }}
        >
          <div style={{ fontSize: "25px", marginLeft: "30px", height: "40px" }}>
            <IoInvertMode onClick={toggleDarkMode} />
          </div>
        </div>
        <h1 className="app-title">Standard Grid</h1>
        <div>
          {ready ? (
            <Box
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                border: "1px solid gray",
                borderRadius: "10px",
                padding: "10px",
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
                accept=".xlsx,.csv,.parquet"
                onChange={handleAddTab}
              />
            </Box>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
