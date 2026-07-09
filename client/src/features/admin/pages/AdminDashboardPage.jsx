import { motion } from 'framer-motion';
import { Shield, Activity, HardDrive, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
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

export default function AdminDashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-6xl mx-auto space-y-8 text-black"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Shield className="text-black fill-black" size={28} /> Admin Control Center
          </h1>
          <p className="text-sm text-black/70 font-bold mt-1">
            System status monitoring, user management, and proctoring dashboard.
          </p>
        </div>
        <div>
          <Button variant="secondary" className="flex items-center gap-1.5 py-3">
            <RefreshCw size={16} /> Force Sync Status
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
          <Card hover bg="bg-brutal-green" className="flex items-center gap-4 text-black">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">System Status</p>
              <h2 className="text-3xl font-black mt-0.5">Healthy</h2>
              <p className="text-xs font-bold text-black/85 mt-0.5">All services online</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hover bg="bg-brutal-pink" className="flex items-center gap-4 text-black">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Flagged Items</p>
              <h2 className="text-3xl font-black mt-0.5">3</h2>
              <p className="text-xs font-bold text-black/85 mt-0.5">Requires manual review</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hover bg="bg-brutal-purple" className="flex items-center gap-4 text-black">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Active Sessions</p>
              <h2 className="text-3xl font-black mt-0.5">48</h2>
              <p className="text-xs font-bold text-black/85 mt-0.5">Across Web and Mobile</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Monitoring Log */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black uppercase text-black">Recent Security & Audit Logs</h2>
          <Card className="p-0 overflow-hidden">
            <div className="bg-brutal-yellow px-4 py-3 border-b-2 border-black flex items-center gap-2">
              <HardDrive size={16} className="text-black" />
              <span className="text-xs font-black uppercase tracking-wider text-black">Audit Stream</span>
            </div>
            <div className="divide-y-2 divide-black font-mono text-[11px] text-white p-2 space-y-1 bg-black max-h-72 overflow-y-auto">
              <div className="p-1.5 hover:bg-white/10 rounded flex justify-between">
                <span className="text-green-400">[2026-07-05 11:48:08] INFO: Server running in development mode on port 3000</span>
                <span className="text-gray-400 uppercase font-bold text-[9px]">SYSTEM</span>
              </div>
              <div className="p-1.5 hover:bg-white/10 rounded flex justify-between">
                <span className="text-green-400">[2026-07-05 11:48:11] INFO: MongoDB Connected successfully</span>
                <span className="text-gray-400 uppercase font-bold text-[9px]">DATABASE</span>
              </div>
              <div className="p-1.5 hover:bg-white/10 rounded flex justify-between">
                <span className="text-yellow-400">[2026-07-05 11:49:52] WARN: Decoded mock-student-john token bypassing verification</span>
                <span className="text-yellow-500 uppercase font-bold text-[9px]">AUTH</span>
              </div>
              <div className="p-1.5 hover:bg-white/10 rounded flex justify-between">
                <span className="text-gray-200">[2026-07-05 11:50:01] INFO: GET /api/v1/leaderboard - 200 OK</span>
                <span className="text-gray-400 uppercase font-bold text-[9px]">API</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Flagged Submissions Review */}
        <div className="space-y-4">
          <h2 className="text-xl font-black uppercase text-black">Flagged Content</h2>
          <Card className="space-y-4">
            <div className="p-3 border-2 border-black rounded-xl bg-brutal-cream space-y-2 shadow-[2px_2px_0px_0px_#000000]">
              <div className="flex justify-between items-center">
                <Badge variant="danger">AI Proctor Alert</Badge>
                <span className="text-[10px] font-bold text-black/60">10m ago</span>
              </div>
              <p className="text-xs font-black text-black">User: John Doe</p>
              <p className="text-[11px] text-black/85 font-semibold leading-relaxed">
                Tab switching detected during Live Coding Exam. (3 events flagged).
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="danger" className="py-1">Review</Button>
                <Button size="sm" variant="secondary" className="py-1">Dismiss</Button>
              </div>
            </div>

            <div className="p-3 border-2 border-black rounded-xl bg-brutal-cream space-y-2 shadow-[2px_2px_0px_0px_#000000]">
              <div className="flex justify-between items-center">
                <Badge variant="warning">Flagged Comment</Badge>
                <span className="text-[10px] font-bold text-black/60">1h ago</span>
              </div>
              <p className="text-xs font-black text-black">User: Alice Smith</p>
              <p className="text-[11px] text-black/85 font-semibold leading-relaxed">
                Comment: "this course is stupid and teaches absolutely nothing worth learning..."
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="danger" className="py-1">Delete</Button>
                <Button size="sm" variant="secondary" className="py-1">Ignore</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
