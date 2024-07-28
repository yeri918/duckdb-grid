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
                            CREATE VIEW bankdata AS
                            FROM read_parquet('${src}')
                            SELECT *, row_number() over () as rn `;
            await c.query(source);
            await c.close();
        };

        initTable();
    }, []);

    return null;
};

export default InitUserTable;




