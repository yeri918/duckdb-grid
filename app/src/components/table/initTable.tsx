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
                CREATE OR TABLE Employees (
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




