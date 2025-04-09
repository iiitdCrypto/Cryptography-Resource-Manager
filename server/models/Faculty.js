const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['IP', 'IS', 'Capstone', 'BTP', 'Thesis'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  members: [{
    type: String
  }]
});

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  projects: [projectSchema]
});

module.exports = mongoose.model('Faculty', facultySchema);