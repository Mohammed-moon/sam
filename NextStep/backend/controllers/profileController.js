import Profile from '../models/Profile.js';

// Helper function to safely parse JSON strings
const parseJSON = (data) => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    return data; // Return as is if parsing fails
  }
};

// Create Profile
export const createProfile = async (req, res) => {
  try {
    // Check if the user is a "seeker"
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only seekers are allowed to create a profile.' });
    }

    // Parse incoming fields (experience, education, skills, socialLinks, etc.)
    const { fullName, phone, bio, skills, linkedin, github, address } = req.body;

    // Parse nested fields (experience and education)
    const experience = req.body.experience ? parseJSON(req.body.experience) : [];
    const education = req.body.education ? parseJSON(req.body.education) : [];

    // Parse files uploaded (profileImage, resume)
    let profileImage = req.files?.profileImage ? req.files.profileImage[0].filename : null;
    let resume = req.files?.resume ? req.files.resume[0].filename : null;

    // Prepare the profile data object
    const profileData = {
      fullName,
      phone,
      profileImage, // Store only the filename
      resume, // Store only the filename
      experience,
      education,
      bio,
      skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
      socialLinks: {
        linkedin: linkedin || '',
        github: github || '',
      },
      address,
      user: req.user.id, // Associate profile with authenticated user
    };

    // Check if the user already has a profile
    const existingProfile = await Profile.findOne({ user: req.user.id });

    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists. You cannot create a new one.' });
    }

    // If no profile exists, create a new profile
    const profile = new Profile(profileData);
    await profile.save();

    // Ensure images and files are served correctly
    if (profile.profileImage) {
      profile.profileImage = `${process.env.SERVER_URL}/uploads/${profile.profileImage}`;
      console.log('profile.profileImage', profile.profileImage);
    }
    if (profile.resume) {
      profile.resume = `${process.env.SERVER_URL}/uploads/${profile.resume}`;
      console.log('profile.resume', profile.resume);
    }

    return res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Profile (Read)
export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      console.log('Profile not found');
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Ensure images and files are served correctly
    if (profile.profileImage) {
      profile.profileImage = `${process.env.SERVER_URL}/uploads/${profile.profileImage}`;
    }
    if (profile.resume) {
      profile.resume = `${process.env.SERVER_URL}/uploads/${profile.resume}`;
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    // Find the existing profile for the authenticated user
    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Parse incoming fields (experience, education, skills, socialLinks, etc.)
    const { fullName, phone, bio, skills, linkedin, github, address } = req.body;

    // Parse nested fields (experience and education)
    const experience = req.body.experience ? parseJSON(req.body.experience) : [];
    const education = req.body.education ? parseJSON(req.body.education) : [];

    // Parse files uploaded (profileImage, resume)
    let profileImage = req.files?.profileImage ? req.files.profileImage[0].filename : null;
    let resume = req.files?.resume ? req.files.resume[0].filename : null;

    // Update the profile data with new information, merging with existing data
    profile.set({
      fullName: fullName || profile.fullName,
      phone: phone || profile.phone,
      profileImage: profileImage || profile.profileImage,
      resume: resume || profile.resume,
      experience: experience.length > 0 ? experience : profile.experience,
      education: education.length > 0 ? education : profile.education,
      bio: bio || profile.bio,
      skills: skills ? skills.split(',').map(skill => skill.trim()) : profile.skills,
      socialLinks: {
        linkedin: linkedin || profile.socialLinks?.linkedin || '',
        github: github || profile.socialLinks?.github || '',
      },
      address: address || profile.address,
    });

    // Save the updated profile
    await profile.save();

    // Ensure images and files are served correctly
    if (profile.profileImage) {
      profile.profileImage = `${process.env.SERVER_URL}/uploads/${profile.profileImage}`;
    }
    if (profile.resume) {
      profile.resume = `${process.env.SERVER_URL}/uploads/${profile.resume}`;
    }

    return res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Profile
export const deleteProfile = async (req, res) => {
  try {
    // Find and delete the profile for the authenticated user
    const profile = await Profile.findOneAndDelete({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};