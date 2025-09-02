import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import boardReducer from "./boardSlice";

const persistConfig = {
  key: "canva-board-v2",
  storage,
  serialize: true,
  deserialize: true,
  timeout: 0,
  debug: false,
};

const persistedBoardReducer = persistReducer(persistConfig, boardReducer);

export const store = configureStore({
  reducer: { board: persistedBoardReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/REGISTER",
        ],
        ignoredPaths: ["_persist"],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
