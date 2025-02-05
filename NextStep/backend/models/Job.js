import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true, index: true },  // Add index for better performance
  salary: { type: Number, required: true },
  skillsRequired: { type: [String], required: true },  // Skills required for the job
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'paused'],
    default: 'open',
  },
  type: { 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'internship'], 
    required: true 
  },
  remote: { type: Boolean, default: false },  // Indicates if the job is remote
  companyLogo: { 
    type: String,  // Storing logo as base64 string
    required: false  // This is optional, as not every job may have a logo
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

export default Job;
