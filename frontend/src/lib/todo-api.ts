// Todo API calls

import { get, post, put, del } from './api';
import { getAuthToken } from './auth';

// Todo endpoints matching backend routes
const TODO_ENDPOINTS = {
  TODOS: '/api/todos',
  TODO: (id: number) => `/api/todos/${id}`,
};

export interface TodoItem {
  id?: number;
  task: string;
  due_date: string;
  completed?: boolean;
}

/**
 * Get all todos for current user
 */
export async function getTodos(): Promise<TodoItem[]> {
  const token = getAuthToken();
  return get<TodoItem[]>(TODO_ENDPOINTS.TODOS, token || undefined);
}

/**
 * Add new todo
 */
export async function addTodo(todoData: TodoItem): Promise<TodoItem> {
  const token = getAuthToken();
  return post<TodoItem>(TODO_ENDPOINTS.TODOS, todoData, token || undefined);
}

/**
 * Update todo
 */
export async function updateTodo(id: number, todoData: Partial<TodoItem>): Promise<TodoItem> {
  const token = getAuthToken();
  return put<TodoItem>(TODO_ENDPOINTS.TODO(id), todoData, token || undefined);
}

/**
 * Delete todo
 */
export async function deleteTodo(id: number): Promise<void> {
  const token = getAuthToken();
  return del<void>(TODO_ENDPOINTS.TODO(id), token || undefined);
}
