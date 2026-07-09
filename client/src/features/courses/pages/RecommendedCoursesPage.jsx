import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Play, Bookmark, BookmarkCheck, Clock, BookOpen, Globe, Compass, ExternalLink, Sparkles, SlidersHorizontal, Trash2 } from 'lucide-react';
import { COURSES, CATEGORIES } from '../../../data/courses.data';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useToastStore } from '../../../store/toastStore';

export default function RecommendedCoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [savedCourseIds, setSavedCourseIds] = useState([]);
  const [viewSavedOnly, setViewSavedOnly] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  // Load saved courses on mount
  useEffect(() => {
    const saved = localStorage.getItem('brainforge_saved_courses');
    if (saved) {
      try {
        setSavedCourseIds(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved courses:', e);
      }
    }
  }, []);

  const toggleSaveCourse = (courseId) => {
    let updated;
    const isSaved = savedCourseIds.includes(courseId);
    if (isSaved) {
      updated = savedCourseIds.filter((id) => id !== courseId);
      showToast('Course removed from Save for Later', 'info');
    } else {
      updated = [...savedCourseIds, courseId];
      showToast('Course saved to Save for Later!', 'success');
    }
    setSavedCourseIds(updated);
    localStorage.setItem('brainforge_saved_courses', JSON.stringify(updated));
  };

  // Filter courses based on selections
  const filteredCourses = COURSES.filter((course) => {
    // Search query match
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category match
    const matchesCategory = 
      selectedCategory === 'All' || course.category === selectedCategory;

    // Difficulty match
    const matchesDifficulty = 
      selectedDifficulty === 'All' || course.difficulty === selectedDifficulty;

    // Language match
    const matchesLanguage = 
      selectedLanguage === 'All' || course.language === selectedLanguage;

    // Saved only match
    const matchesSaved = !viewSavedOnly || savedCourseIds.includes(course.id);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesLanguage && matchesSaved;
  });

  return (
    <div className="min-h-screen bg-brutal-cream text-black py-8 px-4 md:px-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-10 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-[3px] border-black bg-white p-6 md:p-8 rounded-2xl shadow-brutal">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-brutal-yellow border-2 border-black px-3.5 py-1 text-xs font-black uppercase rounded-lg shadow-[2.5px_2.5px_0px_0px_#000] mb-4">
              <Sparkles size={14} /> Curated FREE Content
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wide leading-none">
              Recommended Courses
            </h1>
            <p className="text-sm md:text-base font-bold text-black/75 mt-3 max-w-2xl">
              Skip hours of searching on YouTube. Learn with the best tutorials hand-picked by industry professionals and AI mentors.
            </p>
          </div>
          
          {/* Quick stats / overview */}
          <div className="flex flex-wrap justify-center gap-3 shrink-0">
            <div className="bg-brutal-pink border-2 border-black px-4 py-3 rounded-xl shadow-[3px_3px_0px_0px_#000] text-center min-w-[100px]">
              <span className="text-xs font-mono font-bold block opacity-70">CREATORS</span>
              <span className="text-lg font-black block">6 TOP</span>
            </div>
            <div className="bg-brutal-green border-2 border-black px-4 py-3 rounded-xl shadow-[3px_3px_0px_0px_#000] text-center min-w-[100px]">
              <span className="text-xs font-mono font-bold block opacity-70">CATEGORIES</span>
              <span className="text-lg font-black block">{CATEGORIES.length} TECHS</span>
            </div>
            <div className="bg-brutal-yellow border-2 border-black px-4 py-3 rounded-xl shadow-[3px_3px_0px_0px_#000] text-center min-w-[100px]">
              <span className="text-xs font-mono font-bold block opacity-70">TOTAL</span>
              <span className="text-lg font-black block">FREE 🔥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <input 
            type="text" 
            placeholder="Search by course title, instructor, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-sm font-bold border-[3px] border-black p-3.5 pl-10 rounded-xl shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[5px_5px_0px_0px_#000] transition-all"
          />
          <Search className="absolute left-3.5 top-4.5 text-black/60" size={18} />
        </div>

        {/* Difficulty Filter */}
        <div className="relative">
          <select 
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full bg-white text-sm font-black uppercase border-[3px] border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <SlidersHorizontal className="absolute right-3.5 top-4.5 text-black/60 pointer-events-none" size={16} />
        </div>

        {/* Language Filter */}
        <div className="relative">
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full bg-white text-sm font-black uppercase border-[3px] border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="All">All Languages</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
          <SlidersHorizontal className="absolute right-3.5 top-4.5 text-black/60 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Main Grid: Sidebar Categories + Courses Feed */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar categories / Saved Courses Tab */}
        <div className="space-y-4">
          <div className="bg-white border-[3px] border-black p-4 rounded-xl shadow-brutal">
            <h2 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
              <Compass size={16} /> Filter by Technology
            </h2>

            {/* Save for Later Tab Toggle */}
            <button
              onClick={() => {
                setViewSavedOnly(!viewSavedOnly);
                setSelectedCategory('All');
              }}
              className={`w-full flex items-center justify-between text-left p-3 rounded-lg border-2 border-black mb-4 font-black transition-all ${
                viewSavedOnly 
                  ? 'bg-brutal-pink text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-brutal-cream/40 text-black hover:bg-brutal-cream/80'
              }`}
            >
              <span className="flex items-center gap-2 text-xs uppercase">
                <BookmarkCheck size={14} /> Saved Courses
              </span>
              <span className="bg-white border border-black text-[10px] px-2 py-0.5 rounded font-mono">
                {savedCourseIds.length}
              </span>
            </button>

            {/* List of categories */}
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setViewSavedOnly(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-black uppercase border-2 transition-all ${
                  selectedCategory === 'All' && !viewSavedOnly
                    ? 'bg-brutal-yellow border-black shadow-[2px_2px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-transparent border-transparent hover:bg-brutal-cream/50'
                }`}
              >
                All Technologies ({COURSES.length})
              </button>
              
              {CATEGORIES.map((cat) => {
                const count = COURSES.filter(c => c.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setViewSavedOnly(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-black uppercase border-2 transition-all flex items-center justify-between ${
                      selectedCategory === cat && !viewSavedOnly
                        ? 'bg-brutal-yellow border-black shadow-[2px_2px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-transparent border-transparent hover:bg-brutal-cream/50'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="opacity-60 text-[10px] font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Courses Feed */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="popLayout">
            {filteredCourses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-[3px] border-black p-12 rounded-2xl text-center shadow-brutal"
              >
                <Compass className="w-16 h-16 text-black mx-auto mb-4 animate-bounce" />
                <h3 className="text-xl font-black uppercase">No Curated Courses Found</h3>
                <p className="text-sm font-bold text-black/60 mt-2 max-w-md mx-auto">
                  Try adjusting your filters, clearing your search query, or checking your Saved Courses list.
                </p>
                <Button 
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedDifficulty('All');
                    setSelectedLanguage('All');
                    setSearchQuery('');
                    setViewSavedOnly(false);
                  }}
                  className="mt-6"
                >
                  Reset All Filters
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredCourses.map((course) => {
                  const isSaved = savedCourseIds.includes(course.id);
                  const colors = ['bg-[#FFE600]', 'bg-[#4ADE80]', 'bg-[#FFAED7]', 'bg-[#E9D5FF]'];
                  const randomBg = colors[course.title.charCodeAt(0) % colors.length];

                  return (
                    <motion.div
                      layout
                      key={course.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card hover className="h-full flex flex-col justify-between overflow-hidden bg-white p-0">
                        {/* Course Thumbnail */}
                        <div className="relative border-b-[3px] border-black bg-black aspect-video overflow-hidden">
                          <img 
                            src={`https://img.youtube.com/vi/${course.videoId}/mqdefault.jpg`} 
                            alt={course.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          
                          {/* Platform Badge */}
                          <span className="absolute top-3 left-3 bg-[#FF0000] text-white border-2 border-black px-2 py-0.5 text-[9px] font-black rounded-md shadow-[1.5px_1.5px_0px_0px_#000] uppercase font-mono">
                            {course.platform}
                          </span>

                          {/* Category Badge */}
                          <span className="absolute bottom-3 left-3 bg-white text-black border-2 border-black px-2 py-0.5 text-[9px] font-black rounded-md shadow-[1.5px_1.5px_0px_0px_#000] uppercase font-mono">
                            {course.category}
                          </span>
                        </div>

                        {/* Card Contents */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black uppercase text-black/60 tracking-wider">
                                INSTRUCTOR: {course.instructor}
                              </span>
                              <span className="flex items-center gap-0.5 text-xs font-black text-black">
                                <Star size={12} className="fill-brutal-yellow text-black" /> {course.rating}
                              </span>
                            </div>

                            <h3 className="text-base font-black text-black uppercase leading-tight hover:underline">
                              {course.title}
                            </h3>

                            <p className="text-xs text-black/75 mt-2 line-clamp-2 font-semibold">
                              {course.description}
                            </p>
                          </div>

                          <div className="mt-5">
                            {/* Metadata Row */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="bg-brutal-cream border border-black px-2 py-0.5 text-[9px] font-bold text-black rounded font-mono flex items-center gap-1">
                                <Clock size={10} /> {course.duration}
                              </span>
                              <span className="bg-brutal-cream border border-black px-2 py-0.5 text-[9px] font-bold text-black rounded font-mono flex items-center gap-1">
                                <BookOpen size={10} /> {course.lessons} {course.lessons === 1 ? 'Video' : 'Lessons'}
                              </span>
                              <span className="bg-brutal-cream border border-black px-2 py-0.5 text-[9px] font-bold text-black rounded font-mono flex items-center gap-1">
                                <Globe size={10} /> {course.language}
                              </span>
                              <span className={`border border-black px-2 py-0.5 text-[9px] font-bold text-black rounded font-mono uppercase ${
                                course.difficulty === 'Beginner' ? 'bg-brutal-green' : course.difficulty === 'Intermediate' ? 'bg-brutal-yellow' : 'bg-brutal-pink'
                              }`}>
                                {course.difficulty}
                              </span>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2.5">
                              <a 
                                href={course.youtubeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1"
                              >
                                <Button 
                                  className="w-full text-xs font-black"
                                  bg={randomBg}
                                >
                                  Start Learning <ExternalLink size={12} className="ml-1 shrink-0" />
                                </Button>
                              </a>

                              <Button
                                onClick={() => toggleSaveCourse(course.id)}
                                variant="secondary"
                                className="aspect-square p-2.5 shrink-0"
                              >
                                {isSaved ? (
                                  <BookmarkCheck size={16} className="text-black" />
                                ) : (
                                  <Bookmark size={16} className="text-black" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
