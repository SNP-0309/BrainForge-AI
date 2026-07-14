const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// Scrape paid courses from CodeWithHarry courses page
async function scrapeCodeWithHarryPaid() {
  try {
    const url = 'https://www.codewithharry.com/courses';
    logger.info(`Scraping paid courses from CodeWithHarry: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }
    
    const html = await response.text();
    const cardSplitToken = 'class="bg-card border rounded-lg shadow-lg';
    const parts = html.split(cardSplitToken);
    const courses = [];
    
    for (let i = 1; i < parts.length; i++) {
      const cardHtml = parts[i];
      
      const titleMatch = cardHtml.match(/<h2[^>]*>([\s\S]+?)<\/h2>/);
      if (!titleMatch) continue;
      const title = titleMatch[1].replace(/<[^>]*>/g, '').replace(/\t/g, '').trim();
      
      const linkMatch = cardHtml.match(/href="\/courses\/([^"]+)"/);
      const slug = linkMatch ? linkMatch[1] : '';
      const buyUrl = slug ? `https://www.codewithharry.com/courses/${slug}` : 'https://www.codewithharry.com/';
      
      const thumbMatch = cardHtml.match(/<img[^>]+src="([^"]+)"/);
      const thumbnail = thumbMatch ? thumbMatch[1] : '';
      
      const descMatch = cardHtml.match(/<p class="text-muted-foreground text-sm[^>]*>([\s\S]+?)<\/p>/);
      const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      
      const diffMatch = cardHtml.match(/🔍\s*<!-- -->([\s\S]+?)<\/span>/) || cardHtml.match(/🔍\s*([\s\S]+?)<\/span>/);
      const difficulty = diffMatch ? diffMatch[1].replace(/<[^>]*>/g, '').trim().toLowerCase() : 'beginner';
      
      const durationMatch = cardHtml.match(/⏱️\s*<!-- -->(\d+)/) || cardHtml.match(/⏱️\s*(\d+)/);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
      
      const priceMatch = cardHtml.match(/₹<!-- -->(\d+)/) || cardHtml.match(/₹(\d+)/) || cardHtml.match(/text-primary[^>]*>₹<!-- -->(\d+)/) || cardHtml.match(/₹([\d,]+)/);
      let price = 0;
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ''));
      }
      
      courses.push({
        title,
        description: description || `Premium course on ${title}.`,
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop',
        difficulty: ['beginner', 'intermediate', 'advanced'].includes(difficulty) ? difficulty : 'beginner',
        duration: duration || 10,
        price: price || 2999,
        isPaid: true,
        currency: 'INR',
        buyUrl,
        instructor: 'CodeWithHarry',
        platform: 'CodeWithHarry',
        tags: ['Programming', 'CodeWithHarry', 'Paid']
      });
    }
    
    logger.info(`Successfully scraped ${courses.length} paid courses from CodeWithHarry.`);
    return courses;
  } catch (err) {
    logger.error(`CodeWithHarry scraping failed: ${err.message}`);
    return [];
  }
}

// Import free courses from the local client data structure via sandbox evaluation
function importLocalFreeCourses() {
  try {
    const filePath = path.join(__dirname, '../../client/src/data/courses.data.js');
    logger.info(`Importing free courses from client data: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      logger.warn('Client courses.data.js file not found. Skipping local import.');
      return [];
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    content = content
      .replace(/export\s+const\s+COURSES\s*=/g, 'var COURSES =')
      .replace(/export\s+const\s+CATEGORIES\s*=/g, 'var CATEGORIES =');
      
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(content, sandbox);
    
    const rawCourses = sandbox.COURSES || [];
    const courses = rawCourses.map(c => {
      const hoursMatch = (c.duration || '').match(/(\d+)h/);
      const minsMatch = (c.duration || '').match(/(\d+)m/);
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const mins = minsMatch ? parseInt(minsMatch[1]) : 0;
      const durationHours = hours + mins / 60;
      
      return {
        title: c.title,
        description: c.description || `Free video course covering ${c.title}.`,
        thumbnail: c.videoId ? `https://img.youtube.com/vi/${c.videoId}/maxresdefault.jpg` : '',
        difficulty: (c.difficulty || 'beginner').toLowerCase(),
        duration: Math.round(durationHours) || 2,
        isPaid: false,
        price: 0,
        currency: 'INR',
        buyUrl: c.youtubeUrl || '',
        instructor: c.instructor || 'YouTube Creator',
        platform: c.platform || 'YouTube',
        tags: c.tags || [c.category || 'General'],
        originalVideoId: c.videoId
      };
    });
    
    logger.info(`Successfully parsed ${courses.length} free courses from client data.`);
    return courses;
  } catch (err) {
    logger.error(`Local free courses import failed: ${err.message}`);
    return [];
  }
}

// Scrape additional courses from SerpAPI dynamically
async function scrapeSerpApiCourses(query = 'MERN Stack course') {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    logger.warn('SERPAPI_KEY is not defined. Skipping SerpAPI dynamic course discovery.');
    return [];
  }
  
  try {
    logger.info(`Fetching courses from SerpAPI for query: "${query}"`);
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query + ' site:udemy.com')}&api_key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.organic_results || [];
    const courses = [];
    
    for (const result of results) {
      if (!result.link || !result.title) continue;
      
      const isUdemy = result.link.includes('udemy.com');
      const platformName = isUdemy ? 'Udemy' : 'Web';
      
      courses.push({
        title: result.title.replace(/\|.*/, '').replace(/-.*/, '').trim(),
        description: result.snippet || `Online course on ${result.title}.`,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop',
        difficulty: 'intermediate',
        duration: 15,
        isPaid: true,
        price: 3499,
        currency: 'INR',
        buyUrl: result.link,
        instructor: 'Udemy Instructors',
        platform: platformName,
        tags: ['SerpAPI', 'Online Course', 'Udemy']
      });
    }
    
    logger.info(`Successfully scraped ${courses.length} courses from SerpAPI.`);
    return courses;
  } catch (err) {
    logger.error(`SerpAPI search failed: ${err.message}`);
    return [];
  }
}

// Scrape related YouTube videos for free courses using SerpAPI's YouTube search engine
async function scrapeYouTubeVideosForCourse(query) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    logger.warn('SERPAPI_KEY is not defined. Skipping YouTube video search.');
    return [];
  }
  
  try {
    logger.info(`Fetching YouTube videos from SerpAPI for query: "${query}"`);
    const searchUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(query)}&api_key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.video_results || [];
    const videos = [];
    
    for (const res of results) {
      if (!res.title || !res.link) continue;
      
      // Parse video duration (e.g. "12:34" or "1:02:45")
      let durationMinutes = 15;
      if (res.length) {
        const parts = res.length.split(':').map(Number);
        if (parts.length === 2 && !parts.some(isNaN)) {
          durationMinutes = parts[0] + parts[1] / 60;
        } else if (parts.length === 3 && !parts.some(isNaN)) {
          durationMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
        }
      }
      
      videos.push({
        title: res.title,
        videoUrl: res.link,
        thumbnail: res.thumbnail?.static || '',
        description: res.description || `Learn about ${res.title} in this free tutorial video.`,
        duration: Math.round(durationMinutes) || 15
      });
    }
    
    logger.info(`Successfully scraped ${videos.length} YouTube videos for query "${query}".`);
    return videos;
  } catch (err) {
    logger.error(`SerpAPI YouTube search failed for "${query}": ${err.message}`);
    return [];
  }
}

// Run full course sync to populate MongoDB
async function runCourseSync() {
  try {
    logger.info('Starting full course synchronization...');
    
    // Find or create a system creator user
    let systemCreator = await User.findOne({ email: 'admin@brainforge.ai' });
    if (!systemCreator) {
      systemCreator = await User.create({
        firebaseUid: 'system-admin-uid-placeholder',
        name: 'System Admin',
        email: 'admin@brainforge.ai',
        role: 'admin',
        profile: {
          avatar: '',
          xp: 0,
          level: 1,
          coins: 0,
          dailyStreak: 1
        }
      });
    }
    
    // 1. Gather all courses
    const freeCourses = importLocalFreeCourses();
    const paidCourses = await scrapeCodeWithHarryPaid();
    
    // Check if SerpAPI is configured and search
    let serpCourses = [];
    if (process.env.SERPAPI_KEY) {
      const q1 = await scrapeSerpApiCourses('React JS Course');
      const q2 = await scrapeSerpApiCourses('Python Programming Course');
      serpCourses = [...q1, ...q2];
    }
    
    const allCourses = [...freeCourses, ...paidCourses, ...serpCourses];
    logger.info(`Aggregated ${allCourses.length} courses to sync.`);
    
    let createdCount = 0;
    let updatedCount = 0;
    let serpApiCallCount = 0;
    const maxSerpApiCalls = 5; // self-throttling limit to preserve SerpAPI credits
    
    for (const cData of allCourses) {
      const filter = { title: cData.title, platform: cData.platform };
      
      let course = await Course.findOne(filter);
      const toSave = {
        ...cData,
        creator: systemCreator._id,
        status: 'published'
      };
      
      if (!course) {
        course = await Course.create(toSave);
        createdCount++;
      } else {
        await Course.updateOne(filter, toSave);
        updatedCount++;
      }
      
      // Check existing lessons count for this course
      let lessonCount = await Lesson.countDocuments({ course: course._id });
      
      // If it's a free course, and lacks proper lessons (<=1 lesson), enrich it with multiple videos from YouTube
      if (!course.isPaid) {
        if (lessonCount <= 1 && serpApiCallCount < maxSerpApiCalls && process.env.SERPAPI_KEY) {
          logger.info(`Enriching free course "${course.title}" with more videos via SerpAPI YouTube Search...`);
          const youtubeVideos = await scrapeYouTubeVideosForCourse(course.title);
          
          if (youtubeVideos.length > 0) {
            // Delete existing lessons to replace with enriched list
            await Lesson.deleteMany({ course: course._id });
            
            let order = 1;
            for (const video of youtubeVideos) {
              await Lesson.create({
                course: course._id,
                title: video.title,
                content: `In this lesson, we will watch: **${video.title}**.\n\n${video.description}\n\nWatch the full video, take notes, and complete practice challenges.`,
                videoUrl: video.videoUrl,
                order: order++,
                estimatedTime: video.duration,
                isAiGenerated: false
              });
            }
            
            // Calculate total duration in hours and update the course
            const totalMinutes = youtubeVideos.reduce((acc, v) => acc + v.duration, 0);
            const durationHours = Math.ceil(totalMinutes / 60);
            await Course.findByIdAndUpdate(course._id, { duration: durationHours });
            
            lessonCount = youtubeVideos.length;
            serpApiCallCount++;
            logger.info(`Enriched course "${course.title}" with ${youtubeVideos.length} YouTube lessons.`);
          }
        }
      }
      
      // Fallback: Ensure at least one lesson exists for this course if no lessons were created
      if (lessonCount === 0) {
        if (!course.isPaid && cData.buyUrl) {
          await Lesson.create({
            course: course._id,
            title: `Introduction: ${course.title}`,
            content: `Welcome to this tutorial on **${course.title}**!\n\nUse the video player to watch instructions, and follow along with local practice exercises.`,
            videoUrl: cData.buyUrl,
            order: 1,
            estimatedTime: course.duration * 60 || 60,
            isAiGenerated: false
          });
        } else {
          await Lesson.create({
            course: course._id,
            title: 'Welcome & Introduction',
            content: `Welcome to **${course.title}**!\n\nThis is a premium course hosted on **${course.platform}**. To unlock full contents, certification, and project files, please visit the parent checkout page:\n\n[Get Lifetime Access](${course.buyUrl || '#'})`,
            videoUrl: '',
            order: 1,
            estimatedTime: 15,
            isAiGenerated: false
          });
        }
      }
    }
    
    logger.info(`Course synchronization completed! Created: ${createdCount}, Updated: ${updatedCount}`);
    return {
      success: true,
      created: createdCount,
      updated: updatedCount,
      total: allCourses.length
    };
  } catch (error) {
    logger.error(`Course sync service failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  scrapeCodeWithHarryPaid,
  importLocalFreeCourses,
  scrapeSerpApiCourses,
  scrapeYouTubeVideosForCourse,
  runCourseSync
};
