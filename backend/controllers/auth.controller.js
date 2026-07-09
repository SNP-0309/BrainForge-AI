const User = require('../models/user.model');
const gamificationService = require('../services/gamification.service');
const sendResponse = require('../utils/ResponseWrapper');
const { BadRequestError } = require('../utils/CustomError');

const syncUser = async (req, res, next) => {
  try {
    const { uid, email, name, picture } = req.firebaseUser;
    
    if (!uid || !email) {
      return next(new BadRequestError('Invalid Firebase token contents'));
    }

    let user = await User.findOne({ firebaseUid: uid });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        firebaseUid: uid,
        name: name || email.split('@')[0],
        email,
        role: req.firebaseUser.role || 'student',
        profile: {
          avatar: picture || '',
          xp: 0,
          level: 1,
          coins: 0,
          dailyStreak: 1,
          lastActive: new Date(),
        }
      });
    } else {
      // Existing user, update streak
      await gamificationService.updateStreak(user._id);
      // Reload user to get latest streak and lastActive date
      user = await User.findById(user._id);
    }

    // Trigger achievement check
    const newlyUnlocked = await gamificationService.checkAndUnlockAchievements(user._id);

    sendResponse(res, isNewUser ? 201 : 200, isNewUser ? 'User registered successfully' : 'User synchronized successfully', {
      user,
      newlyUnlockedAchievements: newlyUnlocked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncUser,
};
