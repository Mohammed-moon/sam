import mongoose from 'mongoose';

// Subschemas for experience and education
const experienceSchema = new mongoose.Schema({
  years: { type: Number },
  role: { type: String },
  company: { type: String },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: { type: String },
  university: { type: String },
  yearOfGraduation: { type: Number },
}, { _id: false });

// Application Schema
const applicationSchema = new mongoose.Schema(
  {
    job: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Job', 
      required: true 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    profile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Profile', 
      required: true,  // Reference to the job seeker's profile
    },
    resume: { 
      type: String, 
      required: true 
    },
    status: {
      type: String,
      enum: ['applied', 'approved', 'rejected', 'interview'],
      default: 'applied',  // Status of the application
    },
    appliedAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    },
    experience: [experienceSchema],  // Embed experience details in the application schema
    education: [educationSchema],    // Embed education details in the application schema
    skills: { type: [String] },       // Include skills in the application schema
    socialLinks: {
      linkedin: { type: String },
      github: { type: String },
      twitter: { type: String },
    },
  },
  { timestamps: true }
);

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

export default Application;
