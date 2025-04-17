import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import ModelEx from "./components/ModelEx";

import Universal from "./modelEx/Universal";
import Curly from "./modelEx/Curly";
import Dreadlocks from "./modelEx/Dreadlocks";
import Kinky from "./modelEx/Kinky";
import Stright from "./modelEx/Stright";
import Wavy from "./modelEx/Wavy";
import Kinky2 from "./modelEx/Kinky2";
import Wavy2 from "./modelEx/Wavy2";

import Develop from "./components/Develop";
import Classify from "./components/Classify";
import Run3dgs from "./components/Run3dgs";
import Viewer from "./components/Viewer";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ModelEx" element={<ModelEx />} />

          <Route path="/Universal" element={<Universal />} />
          <Route path="/Curly" element={<Curly />} />
          <Route path="/Dreadlocks" element={<Dreadlocks />} />
          <Route path="/Kinky" element={<Kinky />} />
          <Route path="/Stright" element={<Stright />} />
          <Route path="/Wavy" element={<Wavy />} />
          <Route path="/Kinky2" element={<Kinky2 />} />
          <Route path="/Wavy2" element={<Wavy2 />} />

          <Route path="/Develop" element={<Develop />} />
          <Route path="/Classify" element={<Classify />} />
          <Route path="/Run3dgs" element={<Run3dgs />} />
          <Route path="/Viewer" element={<Viewer />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
