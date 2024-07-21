import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import StdAgGrid from './components/grid/stdGrid.tsx';
// import DuckDBGrid from './components/grid/duckdbGrid.js';


function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ width: '100%' }}>
        <h1>Standard Grid</h1>
        <div style={{ width: '100%' }}>
          <StdAgGrid />
        </div>
    </div>
  )
}

export default App
