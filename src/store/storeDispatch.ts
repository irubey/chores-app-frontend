// frontend/src/store/storeDispatch.ts

import type { AppDispatch } from "./store";
import { logger } from "@/lib/api/logger";

let appDispatch: AppDispatch | undefined;

export const setAppDispatch = (dispatch: AppDispatch) => {
  logger.debug("Setting app dispatch");
  appDispatch = dispatch;
};

export const getAppDispatch = (): AppDispatch => {
  if (!appDispatch) {
    logger.error("Dispatch has not been set");
    throw new Error(
      "Dispatch has not been set. Make sure to call setAppDispatch when initializing the store."
    );
  }
  return appDispatch;
};
