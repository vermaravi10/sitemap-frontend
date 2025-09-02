import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/store";

import "./App.css";
import CanvaBoard from "./components/CanvaBoard";
import { Provider } from "react-redux";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CanvaBoard />
      </PersistGate>
    </Provider>
  );
}

export default App;
