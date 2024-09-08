import React, { useState, useEffect } from 'react';
import db from "./duckDB";
import { ColumnDataType } from "../grid/gridTypes";


/**
 * This function initializes the table.
 *
 * Soruce of data:
 *  - Local:CSV
 *  - Local:Parquet
 *  - S3:CSV
 *  - S3:Parquet
 *
 */
export const InitUserTable = () => {
  useEffect(() => {
    const initTable = async () => {
      const c = await db.connect();
      await c.query(`
                CREATE OR REPLACE TABLE Employees (
                    ID INT PRIMARY KEY,
                    Name VARCHAR(50),
                    Age INT,
                    Address VARCHAR(255),
                    Salary REAL
                );
            `);
      await c.close();
    };

    initTable();
  }, []);

  return null;
};

export const InitParquetTable = (filename: string, columnDataType: ColumnDataType) => {
  const [loadingStatus, setLoadingStatus] = useState('loading'); // 'loading', 'success', 'failed'
  const sleep = (ms: any) => new Promise(r => setTimeout(r, ms)); // For testing only.
  const timeoutThreshold = 5; // In seconds


  useEffect(() => {
    const initTable = async () => {
      const c = await db.connect();

      /*
        *****************Start of User Input Area****************
        Specify the table below.
        We can use 
            - CREATE TABLE for in memory view
            - CREATE VIEW for not using meory.
      */
      const src = new URL(filename, document.baseURI).href;
      const selectQuery = Object.keys(columnDataType)
        .map((key) => {
          // We force all Date Column to be string.
          if (columnDataType[key] === "DATE") {
            return `strftime(${key}, '%Y-%m-%d')::VARCHAR as ${key}`
          } else {
            return `${key}::${columnDataType[key]} as ${key}`;
          }
        })
        .join(", ");
      const source = `
                            CREATE OR REPLACE VIEW bankdata AS
                            FROM read_parquet('${src}')
                            SELECT ${selectQuery};
                    `;
      console.log("Check", source);
      // await sleep(10000); // Can comment this line to check the Timeout.
      await c.query(source);
      await c.close();

    };
    const initTableWithTimeout = async () => {
      try {
        await Promise.race([
          initTable(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`initTable took more than ${timeoutThreshold} seconds`)), timeoutThreshold * 1000)
          )
        ]);
      } catch (error: any) {
        console.error(error.message); // initTable took more than 5 seconds
        setLoadingStatus('failed');
      }
    };

    initTableWithTimeout();
  }, []);

  if (loadingStatus === 'failed') {
    return <div>Loading exceeded {timeoutThreshold} seconds. Please refresh. </div>;
  }

  return null;
};

export const InitS3ParquetTable = () => {
  useEffect(() => {
    const initTable = async () => {
      const c = await db.connect();
      const taxiBucket = "bucket-duck";
      const taxiPath = "taxi_202304.parquet";
      const taxiTableName = "taxi";
      const taxiQuery = `
                            SET s3_region = 'ap-southeast-2';
                            SET s3_use_ssl = false;
                            SET s3_access_key_id = '${import.meta.env.VITE_S3_ACCESS_KEY
        }';
                            SET s3_secret_access_key = '${import.meta.env.VITE_S3_SECRET_ACCESS_KEY
        }';
                            CREATE OR REPLACE TABLE ${taxiTableName} AS
                            SELECT *
                            FROM 's3://${taxiBucket}/${taxiPath}';
                            `;
      await c.query(taxiQuery);
      const result = await c.query(`SELECT * FROM ${taxiTableName} LIMIT 10`);
      await c.close();
      console.log(result);
    };
    initTable();
  }, []);
  return null;
};

export default InitUserTable;
