import { useEffect, useState, useRef } from "react";
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
import { InitParquetTable } from "./components/table/initTable";
import { IoInvertMode } from "react-icons/io5";
import db from "./components/table/duckDB";
import { tableFromArrays } from "apache-arrow";
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  height: string | number;
  width: string | number;
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
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* 
    README: Init Steps
  */
  InitParquetTable("./bankdataset.parquet", "bankdata");

  useEffect(() => {
    const userPrefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDarkMode(userPrefersDark);
  }, []);

  // Tabs init
  useEffect(() => {
    const tabData = [
      {
        label: "Tab 1",
        content: (
          <StdAgGrid tabName="Tab1" darkMode={darkMode} tableName="bankdata" />
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

  function loadFromFileReader(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result;
        if (fileContent) {
          const textContent = new TextDecoder().decode(
            fileContent as ArrayBuffer,
          );
          // Currently only for csv file
          const rows = textContent.split("\n").map((row) => row.split(","));
          const columns = rows[0];

          const data = columns.reduce(
            (acc, col, index) => {
              acc[col] = rows.slice(1).map((row) => row[index]);
              return acc;
            },
            // eslint-disable-next-line
            {} as Record<string, any[]>,
          );

          // Convert data to Arrow Table
          resolve(data);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // eslint-disable-next-line
  const convertDataTypes = (data: Record<string, any[]>) => {
    const convertedData = Object.keys(data).reduce(
      (acc, key) => {
        const columnData = data[key];
        // stop checking if at least one value is non-numeric with some()
        const isNonNumeric = columnData.some((value) => {
          const stringValue = value === undefined ? "0" : value;
          return isNaN(parseFloat(stringValue)) || !isFinite(stringValue);
        });
        acc[key] = !isNonNumeric ? columnData.map(Number) : columnData;
        return acc;
      },
      // eslint-disable-next-line
      {} as Record<string, any[]>,
    );
    return convertedData;
  };
  const handleAddTab = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target.files?.[0];

    // Only action if file exists
    if (file) {
      loadFromFileReader(file).then(async (data) => {
        const newIndex = tabData.length;
        const tableName = `table${newIndex + 1}`;

        // Convert data to Arrow Table
        // eslint-disable-next-line
        const convertedData = convertDataTypes(data as Record<string, any[]>);
        const table = tableFromArrays(convertedData);

        const c = await db.connect();
        await c.insertArrowTable(table, {
          name: `${tableName}`,
          create: true,
        });
        const results = await c.query(`DESCRIBE ${tableName}`);
        console.log("pjulie", JSON.parse(JSON.stringify(results.toArray())));
        await c.close();

        // Create new tab with the new table
        const newTab = {
          label: `Tab ${newIndex + 1}`, // Tab starts at 1, 0 is the plus button
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
      });
    }
  };

  function renderTabs() {
    return (
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="basic tabs example"
      >
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
        {tabData.map((tab, index) => (
          <Tab
            key={index}
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
        key={index}
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
              accept=".csv,.xlsx"
              onChange={handleAddTab}
            />
          </Box>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
