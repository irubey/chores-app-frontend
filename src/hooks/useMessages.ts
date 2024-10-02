'use client'
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import {
  fetchMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  addThread,
  addAttachment,
  selectMessages,
  reset,
} from '../store/slices/messagesSlice';
import { CreateMessageDTO, UpdateMessageDTO, CreateThreadDTO } from '../types/message';

const useMessages = (householdId: string) => {
  const dispatch: AppDispatch = useDispatch();
  const { messages, threads, attachments, isLoading, isSuccess, isError, error } = useSelector(selectMessages);

  const getMessages = async () => {
    await dispatch(fetchMessages(householdId));
  };

  const createMessage = async (messageData: CreateMessageDTO) => {
    await dispatch(addMessage({ householdId, messageData }));
  };

  const editMessage = async (messageId: string, messageData: UpdateMessageDTO) => {
    await dispatch(updateMessage({ householdId, messageId, messageData }));
  };

  const removeMessage = async (messageId: string) => {
    await dispatch(deleteMessage({ householdId, messageId }));
  };

  const createThread = async (messageId: string, threadData: CreateThreadDTO) => {
    await dispatch(addThread({ householdId, messageId, threadData }));
  };

  const uploadAttachment = async (messageId: string, file: File) => {
    await dispatch(addAttachment({ householdId, messageId, file }));
  };

  const resetMessages = () => {
    dispatch(reset());
  };

  return {
    messages,
    threads,
    attachments,
    isLoading,
    isSuccess,
    isError,
    error,
    getMessages,
    createMessage,
    editMessage,
    removeMessage,
    createThread,
    uploadAttachment,
    resetMessages,
  };
};

export default useMessages;