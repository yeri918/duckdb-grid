import { useEffect } from 'react';
import db from '../engine/duckdb';

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
            
            
            /*
                S3 Parquet FIles

                                CREATE SECRET secret1 (
                    TYPE S3,
                    KEY_ID '${import.meta.env.VITE_S3_ACCESS_KEY}',
                    SECRET '${import.meta.env.VITE_S3_SECRET_ACCESS_KEY}',
                    REGION 'ap-southeast-2'
                );
            */
        //    TODO: THIS IS NOT WORKING
        // region: NOT WORKING
            const s3Login = `
                INSTALL httpfs;
                LOAD httpfs;
            `;
            await c.query(s3Login);

            const taxiBucket = 'taxi';
            const taxiPath = 'taxi_202403.parquet';
            const taxiTableName = 'taxi';
            const taxiQuery = `
                            CREATE TABLE ${taxiTableName} AS
                            SELECT *
                            FROM 's3://${taxiBucket}/${taxiPath}';
                            SELECT *, row_number() over () as rn `;
            await c.query(taxiQuery);
            await c.close();
        };
        // endregion

        initTable();
    }, []);

    return null;
};

export default InitUserTable;




