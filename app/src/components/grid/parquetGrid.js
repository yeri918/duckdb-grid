import React, { useEffect, useState } from 'react';
// import { ParquetReader } from 'parquetjs-lite';

import StdAgGrid from './stdGrid';
const ParquetAgGrid = ({ parquetFilePath, columnDefs }) => {
    const [rowData, setRowData] = useState([]);

    

    useEffect(() => {
        const fetchData = async () => {
            try {
                // const reader = await ParquetReader.openFile(parquetFilePath);
                // const cursor = reader.getCursor();
                // const records = [];

                // while (await cursor.next()) {
                //     const record = cursor.getRecord();
                //     records.push(record);
                // }

                // setRowData(records);
            } catch (error) {
                console.error('Error reading Parquet file:', error);
            }
        };

        fetchData();
    }, [parquetFilePath]);

    return <StdAgGrid rowData={rowData} columnDefs={columnDefs} />;
};

export default ParquetAgGrid;