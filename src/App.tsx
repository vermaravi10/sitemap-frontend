import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/store";

import "./App.css";
import FlowBoard from "./components/FlowBoard";

import { Provider } from "react-redux";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <FlowBoard />
      </PersistGate>
    </Provider>
  );
}

export default App;
