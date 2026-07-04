const User = require('../models/user.model');
const sendResponse = require('../utils/ResponseWrapper');
const { NotFoundError } = require('../utils/CustomError');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    sendResponse(res, 200, 'User profile retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    if (name) user.name = name;
    if (avatar) user.profile.avatar = avatar;

    await user.save();
    sendResponse(res, 200, 'User profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Sort users by level desc, then by current XP desc
    const rankings = await User.find()
      .sort({ 'profile.level': -1, 'profile.xp': -1 })
      .limit(Number(limit))
      .select('name profile.avatar profile.level profile.xp profile.dailyStreak');

    sendResponse(res, 200, 'Leaderboard rankings retrieved successfully', rankings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getLeaderboard,
};
