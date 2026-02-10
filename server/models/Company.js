const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    default: 'Information Technology'
  },
  size: {
    type: String,
    enum: ['Startup', 'Small', 'Medium', 'Large', 'Enterprise'],
    default: 'Medium'
  },
  location: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  founded: {
    type: Number
  },
  employees: {
    type: String
  },
  techStack: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  culture: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true
});

companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });

module.exports = mongoose.model('Company', companySchema);