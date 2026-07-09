const User = require('../models/user.model');
const Roadmap = require('../models/roadmap.model');
const gamificationService = require('../services/gamification.service');
const sendResponse = require('../utils/ResponseWrapper');
const { BadRequestError, NotFoundError } = require('../utils/CustomError');

const getDailyMission = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();
    
    // Normalize dates to check if the user's dailyMission is from today
    const isToday = user.profile.dailyMission && 
                    user.profile.dailyMission.date && 
                    new Date(user.profile.dailyMission.date).toDateString() === now.toDateString();

    if (!isToday) {
      // Need to generate a new mission for today!
      const tasks = [];
      
      if (user.profile.chosenCareerPath) {
        // Find the user's current roadmap
        const roadmap = await Roadmap.findOne({ user: user._id, title: `Learning Roadmap: ${user.profile.chosenCareerPath}` });
        
        if (roadmap && roadmap.nodes.length > 0) {
          // Find first unlocked but incomplete node
          const currentNode = roadmap.nodes.find(n => n.status === 'available') || 
                              roadmap.nodes.find(n => n.status === 'locked') ||
                              roadmap.nodes[0];
          
          tasks.push({
            id: 'task_1',
            label: `Complete Lesson: ${currentNode.label}`,
            completed: false,
            type: 'lesson'
          });
          tasks.push({
            id: 'task_2',
            label: `Pass the ${currentNode.label} Quiz`,
            completed: false,
            type: 'quiz'
          });
        } else {
          // Fallback if roadmap has no nodes
          tasks.push({ id: 'task_1', label: 'Explore Curated Courses', completed: false, type: 'lesson' });
          tasks.push({ id: 'task_2', label: 'Complete Daily Review Quiz', completed: false, type: 'quiz' });
        }
      } else {
        // User hasn't chosen a career path yet
        tasks.push({ id: 'task_1', label: 'Start Career Discovery Assessment', completed: false, type: 'assessment' });
        tasks.push({ id: 'task_2', label: 'Explore the Course Catalog', completed: false, type: 'lesson' });
      }

      // Add a general AI Tutor companion task
      tasks.push({
        id: 'task_3',
        label: 'Chat with AI Mentor about today\'s topics',
        completed: false,
        type: 'tutor'
      });

      user.profile.dailyMission = {
        date: now,
        tasks,
        claimed: false
      };
      await user.save();
    }

    sendResponse(res, 200, 'Daily learning mission retrieved', user.profile.dailyMission);
  } catch (error) {
    next(error);
  }
};

const completeMissionTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.profile.dailyMission || !user.profile.dailyMission.tasks) {
      return next(new BadRequestError('No daily mission active'));
    }

    const task = user.profile.dailyMission.tasks.find(t => t.id === taskId);
    if (!task) {
      return next(new NotFoundError('Task not found in daily mission'));
    }

    task.completed = true;
    await user.save();

    sendResponse(res, 200, 'Daily mission task completed', user.profile.dailyMission);
  } catch (error) {
    next(error);
  }
};

const claimMissionRewards = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.profile.dailyMission || user.profile.dailyMission.claimed) {
      return next(new BadRequestError('Daily rewards already claimed or no active mission'));
    }

    const allCompleted = user.profile.dailyMission.tasks.every(t => t.completed);
    if (!allCompleted) {
      return next(new BadRequestError('Please complete all daily tasks first'));
    }

    user.profile.dailyMission.claimed = true;
    await user.save();

    // Award Rewards: +50 XP and +15 Coins
    const rewards = await gamificationService.awardRewards(user._id, 50, 15);
    
    // Update daily streak
    const streakInfo = await gamificationService.updateStreak(user._id);

    sendResponse(res, 200, 'Daily mission rewards claimed successfully', {
      rewards,
      streak: streakInfo
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyMission,
  completeMissionTask,
  claimMissionRewards,
};
