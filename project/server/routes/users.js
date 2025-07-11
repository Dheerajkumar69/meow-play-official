import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post('/users/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      email,
      username,
      password
    });
    
    await user.save();
    
    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'meow-play-secret',
      { expiresIn: '7d' }
    );
    
    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'meow-play-secret',
      { expiresIn: '7d' }
    );
    
    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/users/me', auth, async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const userResponse = req.user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.patch('/users/me', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['username', 'bio', 'avatar'];
    
    // Filter out disallowed updates
    const validUpdates = Object.keys(updates).filter(update => 
      allowedUpdates.includes(update)
    );
    
    // Apply updates
    validUpdates.forEach(update => {
      req.user[update] = updates[update];
    });
    
    await req.user.save();
    
    // Return updated user without password
    const userResponse = req.user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Follow a user
router.post('/users/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already following
    if (req.user.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }
    
    // Add to following list
    req.user.following.push(req.params.id);
    await req.user.save();
    
    // Add to followers list of the other user
    userToFollow.followers.push(req.user.id);
    await userToFollow.save();
    
    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unfollow a user
router.post('/users/:id/unfollow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }
    
    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove from following list
    req.user.following = req.user.following.filter(
      id => id.toString() !== req.params.id
    );
    await req.user.save();
    
    // Remove from followers list of the other user
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id
    );
    await userToUnfollow.save();
    
    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;