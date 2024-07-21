// import logo from './logo.svg';
// import './App.css';
// import MyAgGrid from './components/grid/aggrid';

import { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import logo from './logo.svg';
import './App.css';
import StdAgGrid from './components/grid/stdGrid';

function App() {
  return (
    <div>
      <StdAgGrid />
    </div>
  );
}

export default App;
