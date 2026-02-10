const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  techStack: [{
    type: String,
    trim: true
  }],
  experience: {
    level: {
      type: String,
      enum: ['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Principal'],
      default: 'Mid'
    },
    years: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 10 }
    }
  },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' },
    period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' }
  },
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'US' },
    remote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false }
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
    default: 'Full-time'
  },
  category: {
    type: String,
    enum: [
      'Software Development',
      'Frontend Development', 
      'Backend Development',
      'Full Stack Development',
      'Mobile Development',
      'DevOps',
      'Data Science',
      'Machine Learning',
      'Cybersecurity',
      'Cloud Engineering',
      'QA Testing',
      'Product Management',
      'UI/UX Design',
      'System Administration',
      'Database Administration'
    ],
    required: true
  },
  benefits: [{
    type: String,
    trim: true
  }],
  applicationUrl: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    enum: ['Indeed RSS', 'USAJobs.gov', 'Adzuna API', 'LinkedIn', 'AngelList', 'Manual'],
    required: true
  },
  sourceId: {
    type: String,
    required: true
  },
  datePosted: {
    type: Date,
    required: true
  },
  applicationDeadline: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ skills: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ 'location.remote': 1 });
jobSchema.index({ datePosted: -1 });
jobSchema.index({ sourceId: 1 }, { unique: true });
jobSchema.index({ isActive: 1 });

// Virtual for location display
jobSchema.virtual('locationDisplay').get(function() {
  if (this.location.remote) return 'Remote';
  if (this.location.hybrid) return `${this.location.city}, ${this.location.state} (Hybrid)`;
  return `${this.location.city}, ${this.location.state}`;
});

module.exports = mongoose.model('Job', jobSchema);