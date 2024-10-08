"use client";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  fetchThreads,
  createThread,
  fetchMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  reset,
  selectMessages,
} from "../store/slices/messagesSlice";
import { CreateMessageDTO, UpdateMessageDTO } from "../types/message";

export const useMessages = () => {
  const dispatch = useDispatch<AppDispatch>();
  const messagesState = useSelector(selectMessages);

  const getThreads = (householdId: string) =>
    dispatch(fetchThreads(householdId));
  const startNewThread = (
    householdId: string,
    data: { title: string; participants: string[] }
  ) => dispatch(createThread({ householdId, data }));
  const getMessages = (householdId: string, threadId: string) =>
    dispatch(fetchMessages({ householdId, threadId }));
  const sendNewMessage = (
    householdId: string,
    threadId: string,
    messageData: CreateMessageDTO
  ) => dispatch(sendMessage({ householdId, threadId, messageData }));
  const editMessage = (
    householdId: string,
    threadId: string,
    messageId: string,
    messageData: UpdateMessageDTO
  ) =>
    dispatch(updateMessage({ householdId, threadId, messageId, messageData }));
  const removeMessage = (
    householdId: string,
    threadId: string,
    messageId: string
  ) => dispatch(deleteMessage({ householdId, threadId, messageId }));
  const resetMessages = () => dispatch(reset());

  return {
    ...messagesState,
    getThreads,
    startNewThread,
    getMessages,
    sendNewMessage,
    editMessage,
    removeMessage,
    resetMessages,
  };
};
