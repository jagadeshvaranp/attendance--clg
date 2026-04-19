const Task = require('../models/Task');
const User = require('../models/User');

// @desc Create task (admin)
// @route POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const employee = await User.findById(assignedTo);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const task = await Task.create({ title, description, assignedTo, assignedBy: req.user._id, priority, dueDate });
    await task.populate('assignedTo', 'name department employeeId');
    await task.populate('assignedBy', 'name');

    res.status(201).json({ success: true, message: 'Task created', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all tasks (admin) / My tasks (employee)
// @route GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') filter.assignedTo = req.user._id;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name department employeeId')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update task status
// @route PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const { status, title, description, priority, dueDate } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (status) task.status = status;
    if (title && req.user.role === 'admin') task.title = title;
    if (description) task.description = description;
    if (priority && req.user.role === 'admin') task.priority = priority;
    if (dueDate && req.user.role === 'admin') task.dueDate = dueDate;
    if (status === 'completed') task.completedAt = new Date();

    await task.save();
    await task.populate('assignedTo', 'name department employeeId');
    await task.populate('assignedBy', 'name');

    res.json({ success: true, message: 'Task updated', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete task (admin only)
// @route DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
