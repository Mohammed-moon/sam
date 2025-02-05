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

// Main Profile Schema
const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String },
  phone: { type: String },
  profileImage: { type: String },  // URL or path to the image
  resume: { type: String }, // Path to resume file
  experience: [experienceSchema],
  education: [educationSchema],
  address: { type: String },
  bio: { type: String },
  skills: { type: [String] },  // Array of skills
  socialLinks: {
    linkedin: { type: String },
    github: { type: String },
    twitter: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
