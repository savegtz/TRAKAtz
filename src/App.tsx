import { useEffect, useState } from 'react';
import { 
  Activity, 
  Map as MapIcon, 
  Settings, 
  Bell, 
  User, 
  Search, 
  Filter, 
  Fuel, 
  Gauge, 
  Clock,
  LogOut,
  Shield,
  Truck,
  Car,
  AlertTriangle,
  Plus,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTracking } from './hooks/useTracking';
import { useDeviceStore } from './store/useDeviceStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Map } from './components/Map';

// Map Component Placeholder - Replaced by real Map
const LiveMap = () => {
  const { devices } = useDeviceStore();
  
  const moving = devices.filter(d => d.status === 'MOVING').length;
  const idling = devices.filter(d => d.status === 'IDLE').length;
  const offline = devices.filter(d => d.status === 'OFFLINE').length;

  return (
    <div className="w-full h-full bg-[#141414] relative overflow-hidden flex items-center justify-center">
      <Map />
      
      {/* Simulation Overlay for Demo - Now showing real counts */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-8 left-8 bg-[#1a1a1a]/90 border border-white/10 p-4 rounded-lg shadow-2xl backdrop-blur-md z-[1000]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="font-mono text-xs text-white uppercase font-bold">Live Fleet Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Moving', value: moving.toString(), color: 'text-green-500' },
              { label: 'Idling', value: idling.toString(), color: 'text-yellow-500' },
              { label: 'Offline', value: offline.toString(), color: 'text-red-500' },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center gap-8">
                <span className="text-[10px] text-white/50 uppercase">{stat.label}</span>
                <span className={cn("font-mono text-sm font-bold", stat.color)}>{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ 
  fetchProfile, 
  isLoggedIn, 
  userProfile, 
  activeTab, 
  setActiveTab, 
  showAssetList, 
  setShowAssetList 
}: { 
  fetchProfile: () => void, 
  isLoggedIn: boolean, 
  userProfile: any,
  activeTab: string,
  setActiveTab: (t: string) => void,
  showAssetList: boolean,
  setShowAssetList: (v: boolean) => void
}) => {
  const { devices, setDevices } = useDeviceStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const menuItems = [
    { id: 'monitor', icon: MapIcon, label: 'Monitor' },
    { id: 'tracks', icon: Clock, label: 'Tracks' },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts' },
    { id: 'geofence', icon: Shield, label: 'Geofence' },
    { id: 'reports', icon: Activity, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'monitor') {
      if (activeTab === 'monitor') {
        setShowAssetList(!showAssetList);
      } else {
        setActiveTab('monitor');
        setShowAssetList(true);
      }
    } else {
      setActiveTab(tabId);
      setShowAssetList(false);
    }
  };

  const handleAddDevice = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const deviceData = {
      imei: formData.get('imei'),
      name: formData.get('name'),
      plateNumber: formData.get('plateNumber'),
      vehicleType: formData.get('vehicleType'),
    };

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(deviceData),
      });
      if (response.ok) {
        const newDevice = await response.json();
        setDevices([...devices, newDevice]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add device:', error);
    }
  };

  return (
    <aside className="w-64 h-full bg-[#1a1a1a] border-r border-white/5 flex flex-col shrink-0">
      <div className="p-6 border-bottom border-white/5 bg-[#141414]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Activity className="text-white" size={20} />
          </div>
          <h1 className="font-sans font-bold text-lg text-white tracking-tight">FleetPulse<span className="text-blue-500">Pro</span></h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <p className="text-[10px] font-bold text-white/30 uppercase px-3 mb-2 tracking-widest">Main Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all relative group",
              activeTab === item.id 
                ? "bg-blue-600/10 text-blue-400 font-medium" 
                : "text-white/50 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}

        <div className="pt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Actions</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[10px] text-blue-500 hover:bg-blue-600/10 transition-colors uppercase font-bold"
          >
            <Plus size={14} />
            Add New Asset
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#141414]/95 z-50 p-6 flex flex-col justify-center"
          >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-white font-bold text-lg">Register New Asset</h2>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Add tracking device to fleet</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">✕</button>
              </div>
              <form className="space-y-4" onSubmit={handleAddDevice}>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 font-bold uppercase px-1 tracking-widest">Asset Name</label>
                  <input name="name" placeholder="e.g. Scania Tanker 01" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 font-bold uppercase px-1 tracking-widest">Device IMEI</label>
                  <input name="imei" placeholder="15-digit IMEI number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 font-bold uppercase px-1 tracking-widest">Plate Number</label>
                  <input name="plateNumber" placeholder="e.g. T 456 XXX" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 font-bold uppercase px-1 tracking-widest">Vehicle Type</label>
                  <select name="vehicleType" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none">
                    <option value="TRUCK">Heavy Truck / Trailer</option>
                    <option value="CAR">Personal Car</option>
                    <option value="VAN">Delivery Van</option>
                    <option value="BUS">Passenger Bus</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] mt-4">
                  Confirm Registration
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 border-t border-white/5 bg-[#141414]">
        <div 
          onClick={fetchProfile}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{isLoggedIn && userProfile ? userProfile.name : "Saveg Admin"}</p>
            <p className="text-[10px] text-white/30 uppercase">Premium Member</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
          >
            <LogOut className="text-white/20 group-hover:text-red-400 transition-colors" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

// Main Layout
export default function App() {
  const { socket } = useTracking();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('monitor');
  const [showAssetList, setShowAssetList] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { devices, selectedDeviceId, selectDevice, setDevices } = useDeviceStore();
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  useEffect(() => {
    setIsLoaded(true);
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchDevices();
    }
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch(`/api/devices?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Fetch devices error:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setShowProfileModal(true);
        setNewPassword(''); // Reset password field
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Nywila lazima iwe angalau na herufi 6.");
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
      
      if (response.ok) {
        alert("Nywila imebadilishwa kikamilifu!");
        setNewPassword('');
      } else {
        const data = await response.json();
        alert(data.error || "Imeshindwa kubadili nywila.");
      }
    } catch (error) {
      alert("Hitilafu ya mtandao.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');
    const tenantName = formData.get('tenantName');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const body = isRegistering 
      ? { email, password, name, tenantName } 
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (isRegistering) {
          setIsRegistering(false);
          setAuthError("Account created! Please login.");
        } else {
          localStorage.setItem('token', data.token);
          setIsLoggedIn(true);
          fetchDevices();
        }
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (error) {
      setAuthError("Server connection error. Check DATABASE_URL.");
    }
  };

  const seedAdmin = async () => {
    setAuthError("Provisioning admin...");
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@fleetpulse.pro', 
          password: 'password123', 
          name: 'System Admin', 
          tenantName: 'Fleet Management HQ' 
        }),
      });
      if (response.ok) {
        setAuthError("Admin created! Try to login now.");
      } else {
        const data = await response.json();
        setAuthError(data.error || "Seed failed");
      }
    } catch (e) {
      setAuthError("Check your DATABASE_URL in Secrets");
    }
  };

  if (!isLoaded) return <div className="h-screen w-screen bg-[#141414]" />;

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-screen bg-[#141414] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="font-sans font-bold text-2xl text-white tracking-tight">FleetPulse<span className="text-blue-500">Pro</span></h1>
          </div>
          
          <form className="space-y-4" onSubmit={handleAuth}>
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase font-bold p-3 rounded text-center">
                {authError}
              </div>
            )}

            {isRegistering && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 px-1">Full Name</label>
                  <input name="name" type="text" placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 px-1">Company Name</label>
                  <input name="tenantName" type="text" placeholder="Transporters Ltd" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 px-1">Email Address</label>
              <input 
                name="email"
                type="email" 
                placeholder="admin@fleetpulse.com" 
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors"
                defaultValue={!isRegistering ? "admin@fleetpulse.pro" : ""}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 px-1">Password</label>
              <input 
                name="password"
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors"
                defaultValue={!isRegistering ? "password123" : ""}
                required
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              {isRegistering ? "Register Account" : "Access Platform"}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-3">
             <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[10px] text-white/30 hover:text-white transition-colors uppercase font-bold tracking-widest text-center"
              >
                {isRegistering ? "Already have an account? Login" : "New? Create an account"}
              </button>

              {!isRegistering && (
                <button 
                  onClick={seedAdmin}
                  className="bg-white/5 border border-white/10 text-[9px] text-blue-400 font-bold uppercase py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  🚀 Setup First Admin (Seed)
                </button>
              )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">Enterprise Fleet Management Solutions</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#141414] text-white font-sans flex overflow-hidden">
      <Sidebar 
        fetchProfile={fetchProfile} 
        isLoggedIn={isLoggedIn} 
        userProfile={userProfile} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showAssetList={showAssetList} 
        setShowAssetList={setShowAssetList} 
      />
      
      <AnimatePresence>
        {showProfileModal && userProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
              >
                ✕
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 mb-4 border-4 border-blue-600/10">
                  <User size={40} />
                </div>
                <h2 className="text-white font-bold text-xl">{userProfile.name}</h2>
                <p className="text-xs text-white/30 uppercase font-bold tracking-widest mt-1">{userProfile.role}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">Email Details</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white font-mono break-all italic">
                    {userProfile.email}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">Account & Security</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/5 overflow-hidden">
                    <div className="p-4 flex justify-between items-center bg-blue-400/5">
                      <span className="text-xs text-white/50 uppercase">Password Status</span>
                      <span className="text-[10px] font-mono bg-green-500/20 text-green-400 px-2 py-1 rounded">ENCRYPTED</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-xs text-white/50 uppercase">User ID</span>
                      <span className="text-[9px] font-mono text-white/30 truncate max-w-[150px]">{userProfile.id}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-xs text-white/50 uppercase">Password (Stored)</span>
                      <span className="text-xs font-mono text-blue-400 font-bold">••••••••••••</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-5">
                  <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Tengeneza Nywila Mpya (Reset)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Weka nywila mpya hapa..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button 
                      onClick={handleUpdatePassword}
                      disabled={isUpdatingPassword}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                    >
                      {isUpdatingPassword ? "..." : "RESET"}
                    </button>
                  </div>
                  <p className="text-[9px] text-white/30 mt-2 italic px-1">
                    * Huulizwi nywila ya zamani. Ukibonyeza RESET, nywila yako mpya itakuwa hiyo uliyoweka hapo juu.
                  </p>
                </div>

                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] mt-4"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex min-w-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'monitor' && showAssetList && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="h-full bg-[#1a1a1a] border-r border-white/5 z-10 overflow-hidden flex flex-col shrink-0"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#141414]">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Asset Fleet</span>
                <div className="flex gap-2">
                   <Search size={14} className="text-white/20" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {devices.map((device) => (
                  <button 
                    key={device.id} 
                    onClick={() => selectDevice(device.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-white/[0.03] transition-all flex flex-col gap-1 group",
                      selectedDeviceId === device.id 
                        ? "bg-blue-600/10 border-l-2 border-l-blue-500" 
                        : "hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-tight text-white/90">{device.plateNumber}</span>
                      <div className={cn("w-2 h-2 rounded-full",
                        device.status === 'MOVING' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                        device.status === 'IDLE' ? 'bg-yellow-500' : 'bg-red-500'
                      )} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-white/20 uppercase font-medium">{device.status}</p>
                      <p className="text-[10px] text-white/40 font-mono italic">{device.lastPosition?.speed.toFixed(0) || 0} km/h</p>
                    </div>
                  </button>
                ))}
                
                {devices.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-xs text-white/20 italic">No assets connected</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 border-bottom border-white/5 bg-[#1a1a1a] px-8 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-mono font-bold">SYSTEM STABLE</span>
              </div>
              
              <div className="h-8 w-px bg-white/10" />
              
              <div className="flex items-center gap-6">
                {[
                  { icon: Truck, label: 'TOTAL', value: devices.length.toString() },
                  { icon: Gauge, label: 'ONLINE', value: devices.filter(d => d.status !== 'OFFLINE').length.toString() },
                  { icon: Fuel, label: 'MOVING', value: devices.filter(d => d.status === 'MOVING').length.toString() },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <item.icon className="text-white/30" size={16} />
                    <div>
                      <p className="text-[8px] text-white/30 font-bold uppercase leading-none mb-0.5">{item.label}</p>
                      <p className="text-xs font-mono font-bold leading-none">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowAssetList(!showAssetList)}
                className={cn("p-2 rounded-md transition-all", showAssetList ? "bg-blue-600/20 text-blue-400" : "text-white/40 hover:text-white")}
                title={showAssetList ? "Hide Asset List" : "Show Asset List"}
              >
                <LayoutDashboard size={18} />
              </button>
              <button className="p-2 text-white/50 hover:text-white transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a1a1a]" />
              </button>
              <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded flex items-center gap-2 border border-yellow-500/20">
                <span className="text-[10px] font-bold uppercase">Mi Coins</span>
                <span className="font-mono font-bold text-xs">1,240.50</span>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 min-h-0 relative">
            <LiveMap />
          </div>
        </div>
      </main>

      {/* Right Detail Panel */}
      <AnimatePresence>
        {selectedDevice && (
          <motion.div 
            initial={{ x: 350 }}
            animate={{ x: 0 }}
            exit={{ x: 350 }}
            className="w-[350px] h-full bg-[#1a1a1a] border-l border-white/5 flex flex-col"
          >
            <div className="p-6 border-bottom border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-mono text-xs font-bold text-white/50 uppercase tracking-widest">Asset Details</h2>
                <button onClick={() => selectDevice(null)} className="text-white/30 hover:text-white shrink-0">✕</button>
              </div>
              
              <div className="bg-[#141414] p-4 rounded-lg border border-white/10 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded flex items-center justify-center text-blue-400">
                    <Truck size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-white truncate">{selectedDevice.plateNumber}</h3>
                    <p className="text-xs text-white/30 uppercase truncate">{selectedDevice.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-2 rounded">
                    <p className="text-[8px] text-white/30 uppercase mb-1">Status</p>
                    <p className={cn("text-xs font-bold uppercase", 
                      selectedDevice.status === 'MOVING' ? 'text-green-400' : 
                      selectedDevice.status === 'IDLE' ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {selectedDevice.status}
                    </p>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <p className="text-[8px] text-white/30 uppercase mb-1">Speed</p>
                    <p className="text-xs text-white font-bold">{selectedDevice.lastPosition?.speed.toFixed(0) || 0} km/h</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Real-time Data</p>
                {[
                  { label: 'IMEI', value: selectedDevice.imei },
                  { label: 'Coordinates', value: selectedDevice.lastPosition ? `${selectedDevice.lastPosition.lat.toFixed(4)}, ${selectedDevice.lastPosition.lng.toFixed(4)}` : 'N/A' },
                  { label: 'Engine', value: selectedDevice.status !== 'OFFLINE' ? 'ACC ON' : 'ACC OFF', valueClass: selectedDevice.status !== 'OFFLINE' ? 'text-green-500' : 'text-red-500' },
                  { label: 'Last Update', value: selectedDevice.lastPosition ? new Date(selectedDevice.lastPosition.timestamp).toLocaleTimeString() : 'Never' },
                  { label: 'Voltage', value: '24.1V' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-white/40 uppercase whitespace-nowrap">{item.label}</span>
                    <span className={cn("text-[11px] text-right font-mono", item.valueClass || "text-white/80")}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
               <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Device Commands</p>
               <div className="grid grid-cols-2 gap-2">
                 <button 
                  onClick={async () => {
                    const res = await fetch('/api/commands', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ deviceId: selectedDevice.id, type: 'CUT_FUEL' }),
                    });
                    if (res.ok) alert("Command 'Cut Fuel' has been sent successfully!");
                  }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold p-2 px-3 rounded uppercase hover:bg-red-500/20 transition-all active:scale-95"
                 >
                    Cut Fuel
                 </button>
                 <button 
                  onClick={async () => {
                    const res = await fetch('/api/commands', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ deviceId: selectedDevice.id, type: 'RESTORE_FUEL' }),
                    });
                    if (res.ok) alert("Command 'Restore Fuel' has been sent successfully!");
                  }}
                  className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold p-2 px-3 rounded uppercase hover:bg-green-500/20 transition-all active:scale-95"
                 >
                    Restore Fuel
                 </button>
                 <button 
                  className="bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold p-2 px-3 rounded uppercase hover:bg-white/10 transition-all col-span-2"
                 >
                    Reboot Device
                 </button>
               </div>

               <div className="mt-8 pt-6 border-t border-white/5">
                 <button 
                  disabled={isDeleting}
                  onClick={async () => {
                    const deviceId = selectedDevice.id;
                    const plate = selectedDevice.plateNumber;
                    
                    if (window.confirm(`Futa kifaa ${plate} kabisa? Kitendo hiki hakiwezi kubatilishwa.`)) {
                      setIsDeleting(true);
                      console.log("Trace: Attempting to delete device:", deviceId);
                      
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`/api/devices/${deviceId}`, {
                          method: 'DELETE',
                          headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                          console.log("Trace: Delete success:", data);
                          // Clear selection first to hide the panel
                          selectDevice(null);
                          // Immediately update the local store list to reflect change without waiting for fetch
                          const updatedDevices = devices.filter(d => d.id !== deviceId);
                          setDevices(updatedDevices);
                          
                          // Then fetch fresh list just in case
                          await fetchDevices();
                          alert("Kifaa kimefutwa kikamilifu.");
                        } else {
                          console.error("Trace: Delete failed:", data);
                          alert(`Hitilafu: ${data.error || "Imeshindwa kufuta"}`);
                        }
                      } catch (error) {
                        console.error("Trace: Network error during delete:", error);
                        alert("Hitilafu ya mtandao: Imeshindwa kuwasiliana na seva.");
                      } finally {
                        setIsDeleting(false);
                      }
                    }
                  }}
                  className={cn(
                    "w-full bg-red-600 border border-red-700 text-white text-[10px] font-bold py-3.5 rounded uppercase hover:bg-red-700 transition-all shadow-lg active:scale-95",
                    isDeleting && "opacity-50 cursor-not-allowed animate-pulse"
                  )}
                 >
                    {isDeleting ? "INAFUTA..." : "FUTA ASSET KABISA - PERMANENT"}
                 </button>

               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
