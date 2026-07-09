import { motion } from 'framer-motion';
import { BookOpen, Users, PlusCircle, Video, BarChart2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } },
};

export default function TeacherDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-wider">
            Teacher Portal
          </h1>
          <p className="text-sm text-black/70 font-bold mt-1">
            Create content, manage courses, and monitor student performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" className="flex items-center gap-1.5 py-3">
            <PlusCircle size={16} /> Create Course
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={item}>
          <Card hover bg="bg-brutal-purple" className="flex items-center gap-4 text-black">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Active Students</p>
              <h2 className="text-3xl font-black mt-0.5">142</h2>
              <p className="text-xs font-bold text-black/80 mt-0.5">↑ 12% this week</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hover bg="bg-brutal-yellow" className="flex items-center gap-4 text-black">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Total Courses</p>
              <h2 className="text-3xl font-black mt-0.5">4</h2>
              <p className="text-xs font-bold text-black/80 mt-0.5">1 in draft mode</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hover bg="bg-brutal-green" className="flex items-center gap-4 text-black">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BarChart2 size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Avg. Progress</p>
              <h2 className="text-3xl font-black mt-0.5">68%</h2>
              <p className="text-xs font-bold text-black/80 mt-0.5">↑ 4% this week</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Builder & Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black uppercase text-black">My Courses</h2>
          <Card className="divide-y-2 divide-black p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brutal-yellow border-2 border-black flex items-center justify-center text-black">
                  <Video size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-black">Introduction to Machine Learning</h4>
                  <p className="text-xs font-bold text-black/70">12 lessons • 48 students enrolled</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brutal-yellow border-2 border-black flex items-center justify-center text-black">
                  <Video size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-black">Advanced React and Zustand Design Patterns</h4>
                  <p className="text-xs font-bold text-black/70">8 lessons • 94 students enrolled</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-black flex items-center justify-center text-black">
                  <Video size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-black/70">Fullstack Web App Development with Node.js</h4>
                  <p className="text-xs font-bold text-black/60">0 lessons • Draft Mode</p>
                </div>
              </div>
              <Badge variant="default">Draft</Badge>
            </div>
          </Card>
        </div>

        {/* Dynamic Activity List */}
        <div className="space-y-4">
          <h2 className="text-xl font-black uppercase text-black">Recent Submissions</h2>
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brutal-purple border-2 border-black flex items-center justify-center text-black text-xs font-black">
                JD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-black truncate">John Doe completed Quiz 2</p>
                <p className="text-[10px] text-black/60 font-bold">2 hours ago</p>
              </div>
              <Badge variant="success">90%</Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brutal-yellow border-2 border-black flex items-center justify-center text-black text-xs font-black">
                AS
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-black truncate">Alice Smith submitted Project 1</p>
                <p className="text-[10px] text-black/60 font-bold">4 hours ago</p>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center text-black text-xs font-black">
                BV
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-black truncate">Bob Vance completed Quiz 2</p>
                <p className="text-[10px] text-black/60 font-bold">1 day ago</p>
              </div>
              <Badge variant="danger">45%</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
