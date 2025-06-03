const express = require('express');
const path = require('path');
const { db, init } = require('./db');
const bodyParser = require('body-parser');

init();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// home page listing groups
app.get('/', (req, res) => {
  db.all('SELECT * FROM groups', [], (err, groups) => {
    if (err) return res.status(500).send('Error loading groups');
    res.render('index', { groups });
  });
});

// page to add a new group
app.post('/groups', (req, res) => {
  const name = req.body.name;
  if (!name) return res.redirect('/');
  db.run('INSERT INTO groups (name) VALUES (?)', [name], (err) => {
    res.redirect('/');
  });
});

// list tasks for a group
app.get('/group/:id/tasks', (req, res) => {
  const groupId = req.params.id;
  db.get('SELECT * FROM groups WHERE id = ?', [groupId], (err, group) => {
    if (!group) return res.status(404).send('Group not found');
    db.all('SELECT * FROM tasks WHERE group_id = ?', [groupId], (err2, tasks) => {
      res.render('group', { group, tasks });
    });
  });
});

// create new task for a group
app.post('/group/:id/tasks', (req, res) => {
  const groupId = req.params.id;
  const { title, description } = req.body;
  if (!title) return res.redirect(`/group/${groupId}/tasks`);
  db.run('INSERT INTO tasks (group_id, title, description) VALUES (?, ?, ?)',
    [groupId, title, description], (err) => {
      res.redirect(`/group/${groupId}/tasks`);
    });
});

// view single task and responses
app.get('/group/:groupId/tasks/:taskId', (req, res) => {
  const { groupId, taskId } = req.params;
  db.get('SELECT * FROM tasks WHERE id = ? AND group_id = ?', [taskId, groupId], (err, task) => {
    if (!task) return res.status(404).send('Task not found');
    db.all('SELECT * FROM responses WHERE task_id = ?', [taskId], (err2, responses) => {
      res.render('task', { task, responses, groupId });
    });
  });
});

// submit response
app.post('/group/:groupId/tasks/:taskId/responses', (req, res) => {
  const { groupId, taskId } = req.params;
  const { student_name, answer } = req.body;
  if (!student_name || !answer) return res.redirect(`/group/${groupId}/tasks/${taskId}`);
  db.run('INSERT INTO responses (task_id, student_name, answer) VALUES (?, ?, ?)',
    [taskId, student_name, answer], (err) => {
      res.redirect(`/group/${groupId}/tasks/${taskId}`);
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
