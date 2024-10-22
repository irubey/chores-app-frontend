// frontend/src/hooks/useAuth.ts
"use client";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  login,
  register,
  logout,
  reset,
  selectAuth,
  initializeAuth,
} from "../store/slices/authSlice";
import { useCallback } from "react";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector(selectAuth);

  const loginUser = useCallback(
    (email: string, password: string) => dispatch(login({ email, password })),
    [dispatch]
  );

  const registerUser = useCallback(
    (email: string, password: string, name: string) =>
      dispatch(register({ email, password, name })),
    [dispatch]
  );

  const logoutUser = useCallback(() => dispatch(logout()), [dispatch]);

  const resetAuth = useCallback(() => dispatch(reset()), [dispatch]);

  const initAuth = useCallback(() => {
    if (authState.status === "idle") {
      dispatch(initializeAuth());
    }
  }, [dispatch, authState.status]);
  return {
    ...authState,
    loginUser,
    registerUser,
    logoutUser,
    resetAuth,
    initAuth,
  };
};
