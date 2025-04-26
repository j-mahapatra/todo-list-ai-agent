import { db } from '../db/init.js';
import { todosTable } from '../db/schema.js';
import { eq, ilike } from 'drizzle-orm';

export async function getAllTodos() {
  const todos = await db.select().from(todosTable);
  return todos;
}

export async function createTodo(data) {
  const createdTodo = await db
    .insert(todosTable)
    .values({
      title: data.title,
      content: data.content,
    })
    .returning({
      id: todosTable.id,
    });

  return createdTodo;
}

export async function updateTodo(data) {
  const updatedTodo = await db
    .update(todosTable)
    .set({
      ...(data.title ? { title: data.title } : {}),
      ...(data.content ? { content: data.content } : {}),
    })
    .where(eq(todosTable.id, data.id))
    .returning({
      id: todosTable.id,
    });

  return updatedTodo;
}

export async function findTodo(searchQuery) {
  const todo = await db
    .query()
    .from(todosTable)
    .where(ilike(todosTable.title, searchQuery));

  return todo;
}

export async function deleteTodoById(id) {
  await db.delete(todosTable).where(eq(todosTable.id, id));
}
