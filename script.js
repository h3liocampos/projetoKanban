import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

(() => {
  const STORAGE_KEY = "fluxo-kanban-tasks-v1";
  const statuses = ["todo", "progress", "done"];
  const initialTasks = [
    { id: "sample-1", title: "Mapear referências visuais", description: "Reunir inspirações para a nova identidade do projeto.", status: "todo", createdAt: Date.now() - 172800000 },
    { id: "sample-2", title: "Revisar prioridades da semana", description: "Alinhar entregas e definir o que vem primeiro.", status: "todo", createdAt: Date.now() - 86400000 },
    { id: "sample-3", title: "Montar estrutura inicial", description: "Organizar as seções principais e validar o fluxo.", status: "progress", createdAt: Date.now() - 43200000 },
    { id: "sample-4", title: "Definir escopo do projeto", description: "Objetivos e entregáveis alinhados com a equipe.", status: "done", createdAt: Date.now() - 259200000 }
  ];
  const board = document.querySelector("#board");
  const dialog = document.querySelector("#task-dialog");
  const form = document.querySelector("#task-form");
  const titleInput = document.querySelector("#task-title");
  const descriptionInput = document.querySelector("#task-description");
  const logoutButton = document.querySelector("#logout-button");
  let draggedTaskId = null;
  let storageKey = null;
  let tasks = [];

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    try {
      if (location.protocol !== "file:") await signOut(auth);
      location.assign("login.html");
    } catch {
      logoutButton.disabled = false;
      document.querySelector(".top-note").textContent = "Não foi possível encerrar a sessão";
    }
  });

  function loadTasks() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === null) return initialTasks;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return initialTasks;
      return parsed.filter(task => task && typeof task.id === "string" && typeof task.title === "string" && statuses.includes(task.status));
    } catch {
      return initialTasks;
    }
  }

  function saveTasks() {
    try {
      if (!storageKey) return;
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {
      document.querySelector(".top-note").lastChild.textContent = " Armazenamento indisponível";
    }
  }

  function createIcon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (name === "trash") {
      const paths = ["M3 6h18", "M8 6V4h8v2", "m19 6-1 14H6L5 6", "M10 11v5", "M14 11v5"];
      paths.forEach(path => {
        const element = document.createElementNS("http://www.w3.org/2000/svg", "path");
        element.setAttribute("d", path);
        svg.append(element);
      });
    } else {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z");
      svg.append(path);
    }
    return svg;
  }

  function render() {
    for (const status of statuses) {
      const list = document.querySelector(`[data-list="${status}"]`);
      const columnTasks = tasks.filter(task => task.status === status);
      list.replaceChildren();
      columnTasks.forEach(task => list.append(createTaskCard(task)));
      if (columnTasks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("fill", "none");
        icon.setAttribute("stroke", "currentColor");
        icon.setAttribute("stroke-linecap", "round");
        icon.setAttribute("stroke-linejoin", "round");
        icon.innerHTML = '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>';
        const message = document.createElement("span");
        message.textContent = "Nenhuma tarefa por aqui";
        empty.append(icon, message);
        list.append(empty);
      }
      const count = document.querySelector(`[data-status="${status}"] .count`);
      count.textContent = String(columnTasks.length);
      count.setAttribute("aria-label", `${columnTasks.length} ${columnTasks.length === 1 ? "tarefa" : "tarefas"}`);
    }
    const total = tasks.length;
    document.querySelector("#task-summary").textContent = `${total} ${total === 1 ? "tarefa" : "tarefas"} no quadro`;
  }

  function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.taskId = task.id;
    const top = document.createElement("div");
    top.className = "task-topline";
    const heading = document.createElement("h3");
    heading.textContent = task.title;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.setAttribute("aria-label", `Excluir tarefa: ${task.title}`);
    remove.title = "Excluir tarefa";
    remove.append(createIcon("trash"));
    top.append(heading, remove);
    card.append(top);
    if (task.description) {
      const description = document.createElement("p");
      description.className = "task-description";
      description.textContent = task.description;
      card.append(description);
    }
    const footer = document.createElement("div");
    footer.className = "task-footer";
    const date = document.createElement("span");
    date.className = "tag";
    date.append(createIcon("calendar"));
    const dateText = document.createElement("span");
    dateText.textContent = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(task.createdAt || Date.now()));
    date.append(dateText);
    footer.append(date);
    card.append(footer);
    return card;
  }

  document.querySelector("#open-dialog").addEventListener("click", () => {
    dialog.showModal();
    titleInput.focus();
  });
  document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
  document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => form.reset());

  form.addEventListener("submit", event => {
    event.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }
    tasks.unshift({
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      description: descriptionInput.value.trim(),
      status: "todo",
      createdAt: Date.now()
    });
    saveTasks();
    render();
    dialog.close();
    document.querySelector(`[data-list="todo"] .task-card`)?.focus();
  });

  board.addEventListener("click", event => {
    const button = event.target.closest(".delete-button");
    if (!button) return;
    const card = button.closest(".task-card");
    tasks = tasks.filter(task => task.id !== card.dataset.taskId);
    saveTasks();
    render();
  });

  board.addEventListener("dragstart", event => {
    const card = event.target.closest(".task-card");
    if (!card) return;
    draggedTaskId = card.dataset.taskId;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedTaskId);
  });
  board.addEventListener("dragend", event => {
    event.target.closest(".task-card")?.classList.remove("is-dragging");
    board.querySelectorAll(".column.is-over").forEach(column => column.classList.remove("is-over"));
  });
  board.addEventListener("dragover", event => {
    const column = event.target.closest(".column");
    if (!column) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    column.classList.add("is-over");
  });
  board.addEventListener("dragleave", event => {
    const column = event.target.closest(".column");
    if (column && !column.contains(event.relatedTarget)) column.classList.remove("is-over");
  });
  board.addEventListener("drop", event => {
    const column = event.target.closest(".column");
    if (!column) return;
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;
    const task = tasks.find(item => item.id === taskId);
    if (task) {
      task.status = column.dataset.status;
      saveTasks();
      render();
    }
    column.classList.remove("is-over");
    draggedTaskId = null;
  });

  if (location.protocol === "file:") {
    storageKey = `${STORAGE_KEY}:preview`;
    tasks = loadTasks();
    render();
  } else {
    onAuthStateChanged(auth, user => {
      if (!user) {
        location.replace("login.html");
        return;
      }
      storageKey = `${STORAGE_KEY}:${user.uid}`;
      tasks = loadTasks();
      render();
    });
  }
})();
