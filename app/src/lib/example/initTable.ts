import React, { useState, useEffect } from "react";
import db from "../../duckDB";
import { ColumnDataType } from "../../components/grid/interface/GridInterface";

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
export const initUserTable = () => {
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

export const initParquetTable = (filename: string, tableName: string) => {
  const [loadingStatus, setLoadingStatus] = useState("loading"); // 'loading', 'success', 'failed'
  const sleep = (ms: any) => new Promise((r) => setTimeout(r, ms)); // For testing only.
  const timeoutThreshold = 5; // In seconds

  useEffect(() => {
    const initTable = async () => {
      const c = await db.connect();
      const src = new URL(filename, document.baseURI).href;
      const source = `
                            CREATE OR REPLACE VIEW ${tableName} AS
                            FROM read_parquet('${src}');
                    `;
      // await sleep(10000); // Can comment this line to check the Timeout.
      await c.query(source);
      await c.close();
    };
    const initTableWithTimeout = async () => {
      try {
        await Promise.race([
          initTable(),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `initTable took more than ${timeoutThreshold} seconds`,
                  ),
                ),
              timeoutThreshold * 1000,
            ),
          ),
        ]);
      } catch (error: any) {
        console.error(error.message); // initTable took more than 5 seconds
        setLoadingStatus("failed");
      }
    };

    initTableWithTimeout();
  }, []);

  if (loadingStatus === "failed") {
    return false;
  }

  return true;
};

export const initS3ParquetTable = () => {
  useEffect(() => {
    const initTable = async () => {
      const c = await db.connect();
      const taxiBucket = "bucket-duck";
      const taxiPath = "taxi_202304.parquet";
      const taxiTableName = "taxi";
      const taxiQuery = `
                            SET s3_region = 'ap-southeast-2';
                            SET s3_use_ssl = false;
                            SET s3_access_key_id = '${
                              import.meta.env.VITE_S3_ACCESS_KEY
                            }';
                            SET s3_secret_access_key = '${
                              import.meta.env.VITE_S3_SECRET_ACCESS_KEY
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

export default initUserTable;
