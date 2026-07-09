import { motion } from 'framer-motion';
import { useAuthStore } from '../../../store/authStore';
import Card from '../../../components/ui/Card';
import { User, Mail, ShieldAlert, Award, Compass } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-3xl mx-auto text-black space-y-8 py-4"
    >
      <div className="border-[3px] border-black bg-white p-6 md:p-8 rounded-2xl shadow-brutal flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-brutal-purple border-3 border-black flex items-center justify-center font-mono text-2xl font-black text-black shadow-[3px_3px_0px_0px_#000]">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider">{user?.name || 'Learner'}</h1>
            <p className="text-xs font-mono font-black text-black/60 uppercase">{user?.role || 'Student'} Member</p>
          </div>
        </div>

        <div className="bg-[#4ADE80] border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_#000] text-center font-mono text-xs font-black uppercase">
          Profile Verified
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card bg="#FFFFFF" className="p-6 border-3 border-black">
          <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
            <User size={18} /> Account Details
          </h2>
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-black/50 block">FULL NAME</span>
              <div className="text-sm font-bold text-black bg-brutal-cream/20 border-2 border-black p-2.5 rounded-lg">
                {user?.name || 'Not Available'}
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-black/50 block">EMAIL ADDRESS</span>
              <div className="text-sm font-bold text-black bg-brutal-cream/20 border-2 border-black p-2.5 rounded-lg flex items-center gap-2">
                <Mail size={14} /> {user?.email || 'Not Available'}
              </div>
            </div>
          </div>
        </Card>

        {/* Selected Roadmap path */}
        <Card bg="#FFE600" className="p-6 border-3 border-black flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
              <Compass size={18} /> Career Direction
            </h2>
            <p className="text-xs font-bold text-black/85 leading-relaxed">
              Your chosen learning pathway is currently configured. This will align your roadmap, study materials, and premium course recomendations.
            </p>
          </div>

          <div className="mt-6 bg-white border-2 border-black p-3.5 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] flex items-center justify-between">
            <span className="text-xs font-black uppercase">Active Roadmap:</span>
            <span className="text-xs font-mono font-black uppercase bg-brutal-pink px-2.5 py-0.5 border border-black rounded shadow-[1px_1px_0px_0px_#000]">
              {user?.profile?.chosenCareerPath || 'None Selected'}
            </span>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
