const User = require('../models/user.model');
const Roadmap = require('../models/roadmap.model');
const aiService = require('../services/ai.service');
const sendResponse = require('../utils/ResponseWrapper');
const { BadRequestError } = require('../utils/CustomError');

const runCareerAssessment = async (req, res, next) => {
  try {
    const { responses } = req.body;
    if (!responses) {
      return next(new BadRequestError('Assessment responses are required'));
    }

    // Call AI to analyze and generate recommendations
    const data = await aiService.generateCareerRecommendations(responses);

    // Save results on user profile
    const user = await User.findById(req.user._id);
    user.profile.assessmentRecommendations = data.recommendations || [];
    user.profile.assessmentCompleted = true;
    await user.save();

    sendResponse(res, 200, 'Career assessment completed successfully', {
      recommendations: user.profile.assessmentRecommendations
    });
  } catch (error) {
    next(error);
  }
};

const selectCareerPath = async (req, res, next) => {
  try {
    const { careerPath } = req.body;
    if (!careerPath) {
      return next(new BadRequestError('Career path is required'));
    }

    const user = await User.findById(req.user._id);
    user.profile.chosenCareerPath = careerPath;
    await user.save();

    // Check if user already has a roadmap for this path to avoid duplicate roadmaps
    let roadmap = await Roadmap.findOne({ user: user._id, title: `Learning Roadmap: ${careerPath}` });
    if (!roadmap) {
      // Auto generate initial roadmap nodes using AI
      const generatedNodes = await aiService.generateRoadmap(careerPath);

      roadmap = await Roadmap.create({
        user: user._id,
        title: `Learning Roadmap: ${careerPath}`,
        description: `AI generated learning roadmap for mastering ${careerPath}`,
        nodes: generatedNodes,
      });
    }

    sendResponse(res, 200, 'Career path selected and learning roadmap generated', {
      chosenCareerPath: user.profile.chosenCareerPath,
      roadmapId: roadmap._id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runCareerAssessment,
  selectCareerPath,
};
