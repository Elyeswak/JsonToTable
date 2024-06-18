import React from "react";
import { AppProvider } from "./context/AppContext";
import "./App.css";

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import JsonUpload from "./components/Balance";



const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
         
          <Route path="/" element={<JsonUpload />} />

        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
