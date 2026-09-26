const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const remainingCount = document.querySelector('#remaining-count');
const completedCount = document.querySelector('#completed-count');
const errorMessage = document.querySelector('#error-message');
const filterButtons = document.querySelectorAll('.filter-btn');

let todos = [];
let nextId = 1;
let currentFilter = 'all';

function addTodo(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    errorMessage.textContent = 'Введите текст задачи.';
    return;
  }

  errorMessage.textContent = '';
  todos.push({
    id: nextId,
    text: trimmedText,
    completed: false,
  });

  nextId += 1;
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  render();
}

function getVisibleTodos() {
  if (currentFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }

  if (currentFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

function createTodoElement(todo) {
  const li = document.createElement('li');
  li.className = todo.completed ? 'todo-item completed' : 'todo-item';

  const label = document.createElement('label');
  label.className = 'todo-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.addEventListener('change', () => toggleTodo(todo.id));

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.text;

  label.append(checkbox, text);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-btn';
  deleteButton.textContent = 'Удалить';
  deleteButton.addEventListener('click', () => deleteTodo(todo.id));

  li.append(label, deleteButton);

  return li;
}

function updateStats() {
  const completed = todos.filter((todo) => todo.completed).length;
  remainingCount.textContent = todos.length - completed;
  completedCount.textContent = completed;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });
}

function render() {
  const visibleTodos = getVisibleTodos();

  list.innerHTML = '';
  visibleTodos
    .map(createTodoElement)
    .forEach((element) => list.appendChild(element));

  updateStats();
  updateFilterButtons();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  addTodo(input.value);
  input.value = '';
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

render();