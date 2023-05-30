/* eslint-disable react/no-array-index-key */
/* eslint-disable react/self-closing-comp */
/* eslint-disable no-useless-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import '../assets/css/styles.css';
import Home from './pages/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
