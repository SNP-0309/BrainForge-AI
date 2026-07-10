import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Bell, LogOut, User, Mail, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { logoutUser } from '../config/firebase'
import api from '../config/api'

export default function Navbar({ onAiToggle }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)

  const [activeDropdown, setActiveDropdown] = useState(null) // 'notifications' | 'profile' | null
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      const data = res.data.data || []
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.isRead).length)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation()
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleSignOut = async () => {
    try {
      await logoutUser()
      showToast('Signed out successfully!', 'info')
      navigate('/login')
    } catch (err) {
      console.error('Failed to sign out:', err)
      showToast('Failed to sign out.', 'error')
    }
  }

  const toggleDropdown = (type) => {
    setActiveDropdown(prev => prev === type ? null : type)
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black bg-white shrink-0 relative z-40">
      {/* Title / Branding */}
      <div>
        <span className="font-mono text-[10px] font-black text-black/55 uppercase tracking-wider">
          AI CAREER GUIDANCE
        </span>
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        
        {/* AI Tutor Toggle */}
        <button
          onClick={onAiToggle}
          className="p-2 rounded-xl bg-brutal-yellow border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0"
          title="Open AI Tutor"
        >
          <Bot size={18} />
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button 
            onClick={() => toggleDropdown('notifications')}
            className={`p-2.5 rounded-xl border-2 border-black transition-all relative ${
              activeDropdown === 'notifications'
                ? 'bg-brutal-pink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                : 'bg-white hover:bg-brutal-cream'
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center font-mono text-[9px] font-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {activeDropdown === 'notifications' && (
            <div className="absolute right-0 mt-3 w-80 bg-white border-[3px] border-black rounded-xl shadow-brutal p-4 space-y-3 z-50 text-black">
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                <span className="text-xs font-black uppercase tracking-wide">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-brutal-pink border border-black text-[9px] font-mono font-black px-1.5 py-0.2 rounded">
                    {unreadCount} NEW
                  </span>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-black/60 text-xs font-bold">
                    No notifications available
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id}
                      className={`p-3 rounded-lg border-2 border-black transition-all flex flex-col justify-between gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        notif.isRead ? 'bg-brutal-cream/20 opacity-70' : 'bg-brutal-yellow/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black uppercase text-black leading-tight line-clamp-1">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notif._id)}
                            className="text-[8px] font-mono font-black bg-white border border-black px-1 py-0.2 rounded hover:bg-brutal-yellow"
                          >
                            READ
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-black/80 leading-snug">
                        {notif.message}
                      </p>
                      <span className="text-[8px] font-mono font-bold text-black/50 self-end">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button 
            onClick={() => toggleDropdown('profile')}
            className={`w-9 h-9 rounded-full border-2 border-black flex items-center justify-center font-mono text-sm font-black transition-all cursor-pointer ${
              activeDropdown === 'profile'
                ? 'bg-brutal-purple shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                : 'bg-brutal-purple hover:bg-purple-200 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </button>

          {/* Profile Dropdown Panel */}
          {activeDropdown === 'profile' && (
            <div className="absolute right-0 mt-3 w-64 bg-white border-[3px] border-black rounded-xl shadow-brutal p-4 space-y-4 z-50 text-black">
              {/* User Bio */}
              <div className="space-y-1 border-b-2 border-black/10 pb-3">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-black">
                  <User size={13} /> {user?.name || 'Learner'}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/60 truncate">
                  <Mail size={12} /> {user?.email || 'No email synced'}
                </div>
                <div className="inline-block bg-brutal-cream border border-black text-[9px] font-mono font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#000] uppercase mt-2">
                  Role: {user?.role || 'student'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    navigate('/profile');
                  }}
                  className="w-full text-left font-black text-xs uppercase p-2.5 rounded-lg border-2 border-transparent hover:border-black hover:bg-brutal-cream/30 transition-all flex items-center gap-2"
                >
                  <User size={14} /> Profile Page
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full text-left font-black text-xs uppercase p-2.5 rounded-lg border-2 border-brutal-pink bg-red-50 hover:bg-brutal-pink/30 transition-all flex items-center gap-2 text-red-700"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
