import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "./store/store";

import "./App.css";
import CanvaBoard from "./components/CanvaBoard";

function App() {
  return (
    <PersistGate loading={null} persistor={persistor}>
      <CanvaBoard />
    </PersistGate>
  );
}

export default App;
