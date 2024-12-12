'use client'

import React from 'react';
import { Subtask } from '../../utils/api';

interface SubtaskListProps {
  subtasks: Subtask[];
  onEdit: (subtask: Subtask) => void;
  onDelete: (subtaskId: string) => void;
  onComplete: (subtaskId: string) => void;