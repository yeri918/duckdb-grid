// import logo from './logo.svg';
// import './App.css';
// import MyAgGrid from './components/grid/aggrid';

import { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import logo from './logo.svg';
import './App.css';
import StdAgGrid from './components/grid/stdGrid';
import CsvAgGrid from './components/grid/csvGrid';

function App() {
  return (
    <div>
      <CsvAgGrid />
    </div>
  );
}

export default App;
