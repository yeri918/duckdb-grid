import { useEffect } from "react";
import db from "./duckDB";

interface ColumnAlias {
  [key: string]: string
}
interface Schema {
  columns: ColumnAlias
  dateColumn: string
}

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
        *****************Start of User Input Area****************
        Specify the table below.
        We can use 
            - CREATE TABLE for in memory view
            - CREATE VIEW for not using meory.
      */
      const src = new URL("./bankdataset.parquet", document.baseURI).href;
      let schema: Schema = {
        columns: {
          Domain: "domain",
          Date: "date",
          Location: "today_location",
          Value: "today_daily_value",
          Transaction_count: "today_daily_transaction_count",
        },
        dateColumn: "Date"
      }
      /*
        *****************End of User Input Area*****************
      */

      let selectQuery = "SELECT "
      for(let key in schema.columns){
        if(key == schema.dateColumn){
          selectQuery += `strftime(${key}, '%d%b%Y') as ${schema["columns"][key]}, `
        } else {
          selectQuery += `${key} as ${schema["columns"][key]}, `
        }
        
      }
      console.log("Dom", selectQuery)
      const source = `
                            CREATE OR REPLACE VIEW bankdata AS
                            FROM read_parquet('${src}')
                            ${selectQuery}
                    `;
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
