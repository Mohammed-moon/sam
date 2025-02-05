//jobController.js
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Profile from '../models/Profile.js';
import Fuse from 'fuse.js'; // Import Fuse.js

// Apply for a job
export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;  // Job ID from the URL
    const { experience, education, skills, socialLinks } = req.body;  // Other details for the application

    // Check if the resume file is provided
    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required.' });
    }

    // Check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Check if the user has a profile
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: 'User not authenticated.' });
    }

    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(400).json({ message: 'User profile not found. Please create a profile first.' });
    }

    // Check if the user has already applied for this job
    const existingApplication = await Application.findOne({ job: jobId, user: req.user.id });
    if (existingApplication) {
      // If the user has already applied, return the application status and the count
      return res.status(400).json({
        message: 'You have already applied for this job.',
        applicationStatus: existingApplication.status,  // Optionally, return the application status
        applicationCount: await Application.countDocuments({ job: jobId })  // Return applicant count
      });
    }

    // Create a new application document
    const newApplication = new Application({
      job: jobId,
      user: req.user.id,
      profile: profile.id,  // Link to the user's profile
      resume: req.file.path,  // Save the file path of the uploaded resume
      experience,  // Include experience details
      education,  // Include education details
      skills,  // Include skills
      socialLinks,  // Include social media links
      status: 'applied',  // Default status
    });

    // Save the new application to the database
    await newApplication.save();

    // Update the job's application count
    job.applicationCount += 1;
    await job.save();

    // Return a success response
    return res.status(201).json({ message: 'Application submitted successfully', application: newApplication });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Create a new job
export const createJob = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Only agents can post jobs.' });
    }

    const { title, description, location, salary, type, remote, skills, companyLogo } = req.body;

    // Ensure that skills are provided
    if (!skills || skills.length === 0) {
      return res.status(400).json({ message: 'Skills are required.' });
    }

    // Normalize skills to lowercase
    const normalizedSkills = skills.map(skill => skill.toLowerCase().trim());

    // Create a new Job object
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      type,
      remote,
      skillsRequired: normalizedSkills, // Save the skills here
      postedBy: req.user.id,
      companyLogo, // Save the base64 logo here
    });

    await newJob.save();
    return res.status(201).json({ message: 'Job posted successfully', job: newJob });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get all jobs posted by the authenticated company (Agent)
export const getJobsByCompany = async (req, res) => {
  try {
    // Assuming the 'req.user.id' is the ID of the company (or agent) posting the jobs
    const jobs = await Job.find({ postedBy: req.user.id });

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'No jobs found for this company.' });
    }

    return res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get filtered jobs based on query params
export const getFilteredJobs = async (req, res) => {
  try {
    let { location, salary, remote, type } = req.query;

    let filter = { status: 'open' };

    if (location) {
      location = location.trim();
      filter.location = { $regex: location, $options: 'i' };
    }

    if (salary) {
      filter.salary = { $gte: salary };
    }

    if (remote !== undefined) {
      filter.remote = remote === 'true';
    }

    if (type) {
      filter.type = type;
    }

    const jobs = await Job.find(filter);

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'No jobs found matching your criteria.' });
    }

    return res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Controller function to fetch job details
export const getJobDetails = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Find the job by its ID
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Get the application count for the job
    const applicationCount = await Application.countDocuments({ job: jobId });

    // Add the application count to the job details response
    const jobDetails = {
      ...job.toObject(),
      applicationCount,  // Add the application count here
    };

    // Return the job details including application count
    return res.status(200).json(jobDetails);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a job posting
export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const { title, description, location, salary, status, type, remote, skills, companyLogo } = req.body;

    // Ensure required fields are provided
    if (!title || !description || !location || !salary || !type) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Check if the status is valid
    const validStatuses = ['open', 'closed', 'paused'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Find the job by ID
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    // Ensure the job belongs to the authenticated user (agent)
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to update this job." });
    }

    // Process skills: Check if it's an array or a string
    let skillsArray = [];
    if (Array.isArray(skills)) {
      skillsArray = skills.map(skill => skill.toLowerCase().trim());  // If skills are an array, normalize them
    } else if (typeof skills === 'string') {
      skillsArray = skills.split(',').map(skill => skill.toLowerCase().trim());  // If skills is a string, split and normalize
    }

    // Update job details
    job.title = title;
    job.description = description;
    job.location = location;
    job.salary = salary;
    job.status = status || job.status;  // Use existing status if none is provided
    job.type = type;
    job.remote = remote;
    job.skillsRequired = skillsArray;  // Save the skills as an array
    job.updatedAt = Date.now();

    // If companyLogo is provided, update it
    if (companyLogo) {
      job.companyLogo = companyLogo;  // Update the company logo if a new one is provided
    }

    // Save the updated job
    await job.save();
    return res.status(200).json({ message: "Job updated successfully.", job });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating job", error: error.message });
  }
};

// Delete a job posting
export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    // Find the job by its ID
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Check if the user is authorized to delete this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this job.' });
    }

    // Delete the job
    await Job.findByIdAndDelete(jobId);

    return res.status(200).json({ message: 'Job deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const recommendJobs = async (req, res) => {
  try {
    const { skills } = req.query;  // Get 'skills' from query parameters

    if (!skills) {
      return res.status(400).json({ message: 'Skills query parameter is required' });
    }

    // Split skills into an array and clean up (trim and lowercase)
    const skillsArray = skills.split(',').map(skill => skill.trim().toLowerCase());

    // First, get the authenticated user's profile to extract their skills
    const userProfile = await Profile.findOne({ user: req.user.id });

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Get skills from the user's profile
    const userSkills = userProfile.skills.map(skill => skill.toLowerCase()) || [];

    // Merge user skills with query skills (if needed)
    const combinedSkills = [...new Set([...skillsArray, ...userSkills])];

    // Query the jobs collection to get all jobs with skillsRequired
    const allJobs = await Job.find({ status: 'open' });  // Only open jobs

    if (allJobs.length === 0) {
      return res.status(404).json({ message: 'No jobs found' });
    }

    // Set up Fuse.js options for fuzzy searching
    const fuse = new Fuse(allJobs, {
      keys: ['skillsRequired'],  // Key to search within the job
      threshold: 0.3,  // Lower threshold for more strict matching (adjust as needed)
      includeScore: true,  // Optionally include scores to debug results
      useExtendedSearch: true,  // Allow extended search features
    });

    // Fuse search using the combined skills array
    const fuseResults = fuse.search(combinedSkills.join(' '));

    // If no matches are found using Fuse.js, try direct matching in the database
    if (fuseResults.length === 0) {
      console.log("No fuzzy matches found, searching with direct skill matching...");
      const query = { skillsRequired: { $in: combinedSkills } };
      const directMatches = await Job.find(query).limit(10);  // Limit the number of results

      if (directMatches.length === 0) {
        return res.status(404).json({ message: 'No matching jobs found based on skills' });
      }

      return res.status(200).json(directMatches);
    }

    // Extract matched job IDs from Fuse.js results
    const matchedJobIds = fuseResults.map(result => result.item._id);

    // Query the jobs collection using matched job IDs
    const matchedJobs = await Job.find({ _id: { $in: matchedJobIds } });

    if (matchedJobs.length === 0) {
      return res.status(404).json({ message: 'No matching jobs found based on your skills' });
    }

    // Return matched jobs
    return res.status(200).json(matchedJobs);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update job status
export const updateJobStatus = async (req, res) => {
  try {
    const jobId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['open', 'closed', 'paused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this job.' });
    }

    job.status = status;
    job.updatedAt = Date.now();

    await job.save();
    return res.status(200).json({ message: 'Job status updated successfully', job });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get the number of applications for a specific job
export const getApplicationCountForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Allow all authenticated users to access the application count, no need for agent role
    const applicationCount = await Application.countDocuments({ job: jobId });
    return res.status(200).json({
      message: 'Application count retrieved successfully',
      applicationCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get all jobs with optional filters
export const getJobs = async (req, res) => {
  try {
    const { title, location, salary, remote, fullTime } = req.query;

    let filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (salary) {
      filter.salary = { $lte: Number(salary) };
    }

    if (remote) {
      filter.remote = remote === 'true';
    }

    if (fullTime) {
      filter.type = 'full-time';
    }

    const jobs = await Job.find(filter);

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'No jobs found based on your criteria.' });
    }

    return res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get all jobs the user has applied for
export const getJobsAppliedByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await Application.find({ user: userId }).populate('job');

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found for this user.' });
    }

    const appliedJobs = applications.map((application) => ({
      applicationId: application._id,
      job: application.job,
      status: application.status,
      appliedAt: application.appliedAt,
    }));

    return res.status(200).json({
      message: 'Jobs retrieved successfully',
      appliedJobs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// In jobController.js
export const getApplicationsForJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Find the job by its ID to make sure it exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Fetch all applications for the job and populate applicant details
    const applications = await Application.find({ job: jobId })
      .populate('user', 'name email')  // Populate user details (e.g., name and email)
      .populate('profile', 'experience education skills socialLinks');  // Populate profile information

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found for this job.' });
    }

    // Clean up redundant fields in each application document
    const cleanedApplications = applications.map(application => {
      // Destructure to exclude redundant fields from the application object
      const { experience, education, skills, ...cleanedApplication } = application.toObject();
      return cleanedApplication;
    });

    return res.status(200).json({
      message: 'Applications fetched successfully',
      applications: cleanedApplications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};





export const getJobRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await Profile.findOne({ user: userId });

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Split the skills string into an array of individual skills if it is a single string
    let userSkills = userProfile.skills[0]; // Assuming the skills field is an array with one string
    userSkills = userSkills.split(',').map(skill => skill.trim().toLowerCase()); // Split and normalize user skills

    // Define a mapping of commonly different skill variations
    const skillMapping = {
      'nodejs': ['node.js', 'nodejs'], // Normalizing "node.js" and "nodejs"
      'javascript': ['javascript'], // Keep "javascript" as is
      'react': ['react'], // Keep "react" as is
      // Add more mappings if needed for other common variations
    };

    // Normalize the job skills to match with user skills
    const normalizeSkills = (skills) => {
      return skills.map(skill => {
        // Match skill variations
        for (let key in skillMapping) {
          if (skillMapping[key].includes(skill.trim().toLowerCase())) {
            return key; // Normalize to a common form (e.g., "nodejs")
          }
        }
        return skill.trim().toLowerCase(); // Default to the skill as is if no mapping is found
      });
    };

    // Fetch jobs that match the user's skills
    const recommendedJobs = await Job.find();

    // Filter jobs by matching skills
    const filteredJobs = recommendedJobs.filter(job => {
      const jobSkills = normalizeSkills(job.skillsRequired); // Normalize job skills
      const matchedSkills = userSkills.filter(skill => jobSkills.includes(skill)); // Find matching skills

      return matchedSkills.length > 0; // If there are matching skills, include the job
    });

    // Return jobs, or a message if no matches are found
    if (filteredJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No job recommendations match your skills.',
        jobs: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Jobs recommended based on your skills.',
      jobs: filteredJobs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching job recommendations.',
      error: error.message,
    });
  }
};
