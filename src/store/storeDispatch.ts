// frontend/src/store/storeDispatch.ts

import type { AppDispatch } from "./store";

let appDispatch: AppDispatch | undefined;

export const setAppDispatch = (dispatch: AppDispatch) => {
  appDispatch = dispatch;
};

export const getAppDispatch = (): AppDispatch => {
  if (!appDispatch) {
    throw new Error(
      "Dispatch has not been set. Make sure to call setAppDispatch when initializing the store."
    );
  }
  return appDispatch;
};
