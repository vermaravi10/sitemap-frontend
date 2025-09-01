import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import boardReducer from "./boardSlice";

const persistConfig = {
  key: "canva-board",
  storage,
  whitelist: ["board"],
};

const persistedBoardReducer = persistReducer(persistConfig, boardReducer);

export const store = configureStore({
  reducer: {
    board: persistedBoardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
