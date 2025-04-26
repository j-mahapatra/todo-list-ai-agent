import OpenAI from 'openai';
import readlineSync from 'readline-sync';
import {
  createTodo,
  deleteTodoById,
  findTodo,
  getAllTodos,
  updateTodo,
} from './functions/functions.js';

const openai = new OpenAI();

const SYSTEM_PROMPT = `
    You are an AI ToDo list Assistant with START, PLAN, ACTION, OBSERVATION and OUTPUT states.
    Wait for the user prompt and first PLAN using the available tools.
    After planning, take the ACTION with appropriate tools and wait for the OBSERVATION based on the ACTION.
    Once you get all observations, return the AI response based on START prompt and observations.

    You can manage tasks by creating, viewing, updating and deleting todos. You must strictly follow the JSON output format.

    Todo DB Schema:
    id: int primaryKey
    title: varchar
    content: text
    created_at: timestamp
    updated_at: timestamp

    Available tools:
    - getAllTodos(): Returns all the todos from the database.
    - createTodo(data): Creates a new todo in the database. Takes a data object as parameter that has title (string) and content (string) of the todo. Returns the id of created todo.
    - updateTodo(data): Updates a todo with the given integer id. The data parameter contains id (int) to update, and the new values for title (string), content (string) or both.
    - findTodo(searchQuery: string): Finds a todo whose title matches (ILIKE match) the searchQuery.
    - deleteTodoById(id: string): Deletes a todo with the given ID

    Example:
    { "type": "user", "user": "Add a task for sending email to colleague" }
    { "type": "plan", "plan": "I will get more context on which colleague to send an email to, since the prompt has limited information" }
    { "type": "output", "output": "Can you tell me which colleague to send the email to?" }
    { "type": "user", "user": "I want to send an email to John." }
    { "type": "plan", "plan": "I will use createTodo to create a new todo in the database." }
    { "type": "action", "function": "createTodo", "input": { "title": "Send email", content: "Send email to John (colleague)" } }
    { "type": "observation", "observation": 12},
    { "type": "output", "output": "Your todo was added successfully with ID 12" }
`;

const TOOLS = {
  getAllTodos: getAllTodos,
  createTodo: createTodo,
  updateTodo: updateTodo,
  findTodo: findTodo,
  deleteTodoById: deleteTodoById,
};

const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

while (true) {
  const query = readlineSync.question('>> ');
  const userMessage = {
    type: 'user',
    user: query,
  };

  messages.push({ role: 'user', content: JSON.stringify(userMessage) });

  while (true) {
    const chat = await openai.chat.completions.create({
      model: 'chatgpt-4o-latest',
      messages: messages,
      response_format: { type: 'json_object' },
    });

    const response = chat.choices[0].message.content;

    messages.push({ role: 'assistant', content: response });

    const action = JSON.parse(response);

    if (action.type === 'output') {
      console.log(action.output);
      break;
    } else if (action.type === 'action') {
      const fn = TOOLS[action.function];

      if (!fn) {
        throw new Error('Invalid tool called');
      }

      const observation = await fn(action.input);

      const observationMessage = {
        type: 'observation',
        observation,
      };

      messages.push({
        role: 'developer',
        content: JSON.stringify(observationMessage),
      });
    }
  }
}
