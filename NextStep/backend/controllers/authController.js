// controllers/authController.js
import User from '../models/User.js';

// Register a new user
export const registerUser = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const user = new User({ email, password, role });

    // Save the user to the database
    await user.save();

    // Generate auth token with 7 days expiration
    const token = user.generateAuthToken();

    // Respond with the token and role
    res.status(201).json({
      token,
      role: user.role // Include the role in the response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login an existing user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate auth token with 7 days expiration
    const token = user.generateAuthToken();

    // Respond with the token and role
    res.status(200).json({
      token,
      role: user.role // Include the role in the response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
