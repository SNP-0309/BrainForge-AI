const User = require('../models/user.model');
const Achievement = require('../models/achievement.model');
const UserAchievement = require('../models/user-achievement.model');
const Notification = require('../models/notification.model');
const logger = require('../utils/logger');

class GamificationService {
  /**
   * Adds XP and coins to a user profile, checks for level up, and logs results.
   */
  async awardRewards(userId, xpReward, coinsReward) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Update coins
      user.profile.coins += coinsReward;
      
      // Update XP & level-up checks
      let currentXp = user.profile.xp + xpReward;
      let level = user.profile.level;
      let levelUps = 0;

      // Formula: XP needed to level up = current_level * 100
      let xpNeeded = level * 100;
      while (currentXp >= xpNeeded) {
        currentXp -= xpNeeded;
        level += 1;
        levelUps += 1;
        xpNeeded = level * 100;
      }

      user.profile.xp = currentXp;
      user.profile.level = level;
      user.profile.lastActive = new Date();

      await user.save();
      logger.info(`Rewarded user ${userId}: +${xpReward}XP, +${coinsReward}Coins. Level is now ${level}.`);

      if (levelUps > 0) {
        await Notification.create({
          recipient: userId,
          title: 'Level Up! 🎉',
          message: `Congratulations! You leveled up to Level ${level}! Keep up the amazing work.`,
          type: 'system',
        });
      }

      return {
        level,
        xp: currentXp,
        coins: user.profile.coins,
        leveledUp: levelUps > 0,
      };
    } catch (error) {
      logger.error(`Error awarding rewards: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates user daily streak.
   */
  async updateStreak(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const now = new Date();
      const lastActive = user.profile.lastActive;

      const oneDayMs = 24 * 60 * 60 * 1000;
      
      // Normalize dates to midnight for date-only comparisons
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()).getTime();

      const diffDays = Math.round((today - lastActiveDate) / oneDayMs);

      let streakUpdated = false;
      if (diffDays === 1) {
        // Active yesterday, increment streak
        user.profile.dailyStreak += 1;
        user.profile.lastActive = now;
        await user.save();
        streakUpdated = true;
        
        await Notification.create({
          recipient: userId,
          title: 'Streak Maintained! 🔥',
          message: `Your daily learning streak is now ${user.profile.dailyStreak} days!`,
          type: 'challenge',
        });
      } else if (diffDays > 1) {
        // Break in streak, reset to 1
        user.profile.dailyStreak = 1;
        user.profile.lastActive = now;
        await user.save();
        streakUpdated = true;
      } else if (user.profile.dailyStreak === 0) {
        // First login ever
        user.profile.dailyStreak = 1;
        user.profile.lastActive = now;
        await user.save();
        streakUpdated = true;
      }

      return {
        dailyStreak: user.profile.dailyStreak,
        streakUpdated,
      };
    } catch (error) {
      logger.error(`Error updating daily streak: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scans global achievements list and unlocks eligible achievements for the user.
   */
  async checkAndUnlockAchievements(userId, extraStats = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Fetch all locked achievements for this user
      const unlockedIds = await UserAchievement.find({ user: userId }).distinct('achievement');
      const lockedAchievements = await Achievement.find({ _id: { $nin: unlockedIds } });

      const newlyUnlocked = [];

      for (const ach of lockedAchievements) {
        let isEligible = false;

        switch (ach.criteriaType) {
          case 'xp_earned':
            // Cumulative level approximation or total xp check
            // For simple threshold check we can use: (level - 1) * 100 + user.xp
            const approximateTotalXp = (user.profile.level - 1) * 100 + user.profile.xp;
            if (approximateTotalXp >= ach.criteriaValue) isEligible = true;
            break;
            
          case 'streak':
            if (user.profile.dailyStreak >= ach.criteriaValue) isEligible = true;
            break;

          case 'quiz_score':
            // Check if score threshold is met in extraStats
            if (extraStats.quizScore && extraStats.quizScore >= ach.criteriaValue) isEligible = true;
            break;

          case 'course_completed':
            // Check if completed course count in extraStats meets criteria
            if (extraStats.coursesCompleted && extraStats.coursesCompleted >= ach.criteriaValue) isEligible = true;
            break;

          default:
            break;
        }

        if (isEligible) {
          // Unlock achievement
          await UserAchievement.create({
            user: userId,
            achievement: ach._id,
          });

          // Award achievement reward
          await this.awardRewards(userId, ach.pointsXP, 0);

          // Create notification
          await Notification.create({
            recipient: userId,
            title: `Achievement Unlocked: ${ach.name} 🏆`,
            message: `You earned the badge "${ach.name}"! Reward: +${ach.pointsXP} XP.`,
            type: 'achievement',
          });

          newlyUnlocked.push(ach);
        }
      }

      return newlyUnlocked;
    } catch (error) {
      logger.error(`Error checking achievements: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new GamificationService();
