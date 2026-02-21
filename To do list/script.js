const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
      taskList.innerHTML = '';
      tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `
          <span contenteditable="true" onblur="editTask(${index}, this.innerText)">${task}</span>
          <button onclick="deleteTask(${index})">❌</button>
        `;
        taskList.appendChild(li);
      });
    }

    function addTask() {
      const task = taskInput.value.trim();
      if (task) {
        tasks.push(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
      }
    }

    function deleteTask(index) {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    }

    function editTask(index, newText) {
      tasks[index] = newText.trim();
      saveTasks();
    }

    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') addTask();
    });

    taskList.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', e.target.dataset.index);
    });

    taskList.addEventListener('dragover', e => {
      e.preventDefault();
    });

    taskList.addEventListener('drop', e => {
      const draggedIndex = e.dataTransfer.getData('text/plain');
      const targetIndex = e.target.closest('li').dataset.index;
      if (draggedIndex === targetIndex) return;
      const draggedTask = tasks[draggedIndex];
      tasks.splice(draggedIndex, 1);
      tasks.splice(targetIndex, 0, draggedTask);
      saveTasks();
      renderTasks();
    });

    renderTasks();