//applicationController
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';

export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ['approved', 'rejected', 'interviewing', 'applied'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Valid values are "approved", "rejected", "interviewing", and "applied".' });
    }

    if (!req.user || req.user.role !== 'agent') {
      return res.status(403).json({ message: 'You do not have permission to update the application status.' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status === 'approved' && status === 'interviewing') {
      return res.status(400).json({ message: 'Cannot change status from approved to interviewing.' });
    }
    if (application.status === 'rejected' && status === 'applied') {
      return res.status(400).json({ message: 'Cannot change status from rejected to applied.' });
    }
    if (application.status === 'applied' && status === 'rejected') {
      return res.status(400).json({ message: 'Cannot update a rejected application from applied.' });
    }

    const job = await Job.findById(application.job);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to manage this application' });
    }

    application.status = status;
    application.updatedAt = Date.now();

    await application.save();

    return res.status(200).json({
      message: 'Application status updated successfully',
      application,
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }

    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getApplicationDetails = async (req, res) => {
  try {
    const applicationId = req.params.applicationId;

    const application = await Application.findById(applicationId)
      .populate('user', 'name email')
      .populate('profile', 'bio skills linkedin github twitter')
      .populate('job', 'title company location')
      .exec();

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(application);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await Job.findById(application.job);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this application' });
    }

    await application.remove();

    return res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createApplication = async (req, res) => {
  try {
    const { job, user, profile, resume, experience, education, skills, socialLinks } = req.body;

    if (!job || !user || !profile || !resume) {
      return res.status(400).json({ message: 'Job, User, Profile, and Resume are required' });
    }

    const newApplication = new Application({
      job,
      user,
      profile,
      resume,
      experience,
      education,
      skills,
      socialLinks,
      status: 'applied',
    });

    const application = await newApplication.save();

    return res.status(201).json({
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('user', 'name email')
      .populate('profile', 'bio skills linkedin')
      .populate('job', 'title company location');

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applicants found for this job.' });
    }

    return res.status(200).json({ applications });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createApplicationFromProfile = async (req, res) => {
  try {
    const { job, resume } = req.body;

    if (!job || !resume) {
      return res.status(400).json({ message: 'Job and Resume are required.' });
    }

    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found. Please create a profile first.' });
    }

    const { experience, education, skills, socialLinks } = profile;

    const newApplication = new Application({
      job,
      user: req.user.id,
      profile: profile._id,
      resume,
      experience,
      education,
      skills,
      socialLinks,
      status: 'applied',
    });

    const application = await newApplication.save();

    return res.status(201).json({
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
