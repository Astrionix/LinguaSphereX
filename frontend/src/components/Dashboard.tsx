import { BarChart, PieChart, Activity, Users, Clock, Languages } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 h-full p-6 overflow-y-auto"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Analytics Dashboard
        </h1>
        <p className="text-slate-400 mt-2">Overview of your multilingual interactions</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: <Activity className="text-green-400" />, label: "Active Chats", value: "12", sub: "+2 this week" },
          { icon: <Languages className="text-purple-400" />, label: "Languages Used", value: "8", sub: "Most used: Spanish" },
          { icon: <Clock className="text-blue-400" />, label: "Avg. Response", value: "1.2s", sub: "-0.3s improvement" },
          { icon: <Users className="text-orange-400" />, label: "User Satisfaction", value: "98%", sub: "Based on feedback" }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-800/50 rounded-xl">{stat.icon}</div>
              <span className="text-xs text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded-full">{stat.sub}</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-100">{stat.value}</h3>
            <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
        <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-purple-500/5 pointer-events-none" />
            <BarChart className="w-24 h-24 text-slate-700/50 mb-4 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-slate-500 font-medium">Usage Statistics (Coming Soon)</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 to-green-500/5 pointer-events-none" />
            <PieChart className="w-24 h-24 text-slate-700/50 mb-4 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-slate-500 font-medium">Language Distribution (Coming Soon)</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
