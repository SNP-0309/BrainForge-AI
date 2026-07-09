import { motion } from 'framer-motion';

export default function ProfilePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="text-black space-y-4"
    >
      <h1 className="text-4xl font-black uppercase tracking-wider">Your Profile</h1>
      <p className="text-sm font-bold text-black/70">View your XP progress, completed achievements, and rewards.</p>
    </motion.div>
  );
}
