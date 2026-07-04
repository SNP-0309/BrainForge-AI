const Roadmap = require('../models/roadmap.model');
const aiService = require('../services/ai.service');
const gamificationService = require('../services/gamification.service');
const sendResponse = require('../utils/ResponseWrapper');
const { NotFoundError, BadRequestError } = require('../utils/CustomError');

const getUserRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id }).sort('-updatedAt');
    sendResponse(res, 200, 'User roadmaps retrieved successfully', roadmaps);
  } catch (error) {
    next(error);
  }
};

const generateRoadmap = async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return next(new BadRequestError('Topic is required'));
    }

    // Call AI Service to generate tree nodes structure
    const generatedNodes = await aiService.generateRoadmap(topic);
    
    // Save to DB
    const roadmap = await Roadmap.create({
      user: req.user._id,
      title: `Learning Roadmap: ${topic}`,
      description: `AI generated learning roadmap for mastering ${topic}`,
      nodes: generatedNodes,
    });

    sendResponse(res, 201, 'AI Roadmap generated successfully', roadmap);
  } catch (error) {
    next(error);
  }
};

const getRoadmapById = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user._id });
    if (!roadmap) {
      return next(new NotFoundError('Roadmap not found'));
    }
    sendResponse(res, 200, 'Roadmap retrieved successfully', roadmap);
  } catch (error) {
    next(error);
  }
};

const updateRoadmapNodeStatus = async (req, res, next) => {
  try {
    const { id, nodeId } = req.params;
    const { status } = req.body; // 'locked', 'available', 'completed'

    if (!['locked', 'available', 'completed'].includes(status)) {
      return next(new BadRequestError('Invalid node status'));
    }

    const roadmap = await Roadmap.findOne({ _id: id, user: req.user._id });
    if (!roadmap) {
      return next(new NotFoundError('Roadmap not found'));
    }

    const node = roadmap.nodes.find(n => n.id === nodeId);
    if (!node) {
      return next(new NotFoundError('Roadmap node not found'));
    }

    const oldStatus = node.status;
    node.status = status;

    let xpAwarded = 0;
    // Award XP if completed a node for the first time
    if (status === 'completed' && oldStatus !== 'completed') {
      xpAwarded = 20; // 20 XP for node completion
      await gamificationService.awardRewards(req.user._id, xpAwarded, 2); // 20 XP, 2 Coins
      
      // Auto unlock dependent nodes
      roadmap.nodes.forEach(n => {
        if (n.dependencies.includes(nodeId) && n.status === 'locked') {
          // Check if all dependencies for this node are completed
          const allDepCompleted = n.dependencies.every(depId => {
            const depNode = roadmap.nodes.find(dn => dn.id === depId);
            return depNode && depNode.status === 'completed';
          });
          if (allDepCompleted) {
            n.status = 'available';
          }
        }
      });
    }

    // Check if the whole roadmap is completed
    const allCompleted = roadmap.nodes.every(n => n.status === 'completed');
    roadmap.isCompleted = allCompleted;

    await roadmap.save();

    // Trigger achievements check
    const newlyUnlocked = await gamificationService.checkAndUnlockAchievements(req.user._id);

    sendResponse(res, 200, 'Roadmap node status updated successfully', {
      roadmap,
      xpAwarded,
      newlyUnlockedAchievements: newlyUnlocked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserRoadmaps,
  generateRoadmap,
  getRoadmapById,
  updateRoadmapNodeStatus,
};
