import { useEffect } from "react";
import db from "../engine/duckdb";

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

export const InitParquetTable = () => {
  useEffect(() => {
    const initTable = async () => {
      const c = await db.connect();

      /*
                We can use 
                    - CREATE TABLE for in memory view
                    - CREATE VIEW for not using meory.
            */
      const src = new URL("./bankdataset.parquet", document.baseURI).href;
      const source = `
                            CREATE OR REPLACE VIEW bankdata AS
                            FROM read_parquet('${src}')
                            SELECT *, row_number() over () as rn `;
      await c.query(source);
      await c.close();
    };

    initTable();
  }, []);

  return null;
};

export const InitS3ParquetTable = () => {
  useEffect(() => {
    const initTable = async () => {
      const c = await db.connect();

      /*
                First we do a S3 Login.
                WIP on using Secret Manager.
            */
      // const loginQuery = `
      //     CREATE SECRET secret1 (
      //         TYPE S3,
      //         KEY_ID '${import.meta.env.VITE_S3_ACCESS_KEY}',
      //         SECRET '${import.meta.env.VITE_S3_SECRET_ACCESS_KEY}',
      //         REGION 'ap-southeast-2'
      //     );
      // `;
      // console.log(loginQuery);
      // c.query(loginQuery);

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

export default InitUserTable;
