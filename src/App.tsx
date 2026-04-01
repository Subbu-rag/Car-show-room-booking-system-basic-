import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, onSnapshot, query, where, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { UserProfile, Car, Booking } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Car as CarIcon, User as UserIcon, LogOut, Shield, Clock, CheckCircle, AlertTriangle, Package, ChevronRight, Menu, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initial Car Data
const INITIAL_CARS: Car[] = [
  {
    id: 'eqs-sedan',
    model: 'EQS SEDAN',
    price: 104400,
    description: 'The pinnacle of electric luxury. A masterpiece of aerodynamics and innovation.',
    image: 'https://picsum.photos/seed/eqs/800/600',
    specs: { range: '350 miles', power: '329 hp', acceleration: '5.9s 0-60' }
  },
  {
    id: 'g-class',
    model: 'G-CLASS SUV',
    price: 139900,
    description: 'An icon of off-road prowess. Unmatched presence and capability.',
    image: 'https://picsum.photos/seed/gclass/800/600',
    specs: { engine: 'V8 Biturbo', power: '416 hp', acceleration: '5.6s 0-60' }
  },
  {
    id: 'sl-roadster',
    model: 'SL ROADSTER',
    price: 109900,
    description: 'The return of a legend. Open-air performance and timeless design.',
    image: 'https://picsum.photos/seed/sl/800/600',
    specs: { engine: 'V8 Biturbo', power: '469 hp', acceleration: '3.8s 0-60' }
  }
];

// Components
const GlitchText = ({ text, className }: { text: string; className?: string }) => (
  <div className={cn("relative inline-block group", className)}>
    <span className="relative z-10">{text}</span>
    <span className="absolute top-0 left-0 -z-10 text-neon-magenta opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-75">
      {text}
    </span>
    <span className="absolute top-0 left-0 -z-10 text-neon-cyan opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 group-hover:translate-y-1 transition-all duration-75">
      {text}
    </span>
  </div>
);

const Navbar = ({ userProfile }: { userProfile: UserProfile | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center">
              <CarIcon className="w-5 h-5 text-black" />
            </div>
            <span className="font-mono font-bold text-xl tracking-tighter">
              NEON<span className="text-neon-magenta">-</span>BENZ
            </span>
          </Link>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="hover:text-neon-cyan px-3 py-2 font-mono text-sm uppercase">Catalog</Link>
              {userProfile && (
                <Link to="/dashboard" className="hover:text-neon-cyan px-3 py-2 font-mono text-sm uppercase">My Garage</Link>
              )}
              {userProfile?.role === 'admin' && (
                <Link to="/admin" className="hover:text-neon-magenta px-3 py-2 font-mono text-sm uppercase flex items-center">
                  <Shield className="w-4 h-4 mr-1" /> Admin
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {userProfile ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName}`} className="w-8 h-8 rounded-full border border-neon-cyan" alt="" />
                  <span className="text-xs font-mono opacity-60">{userProfile.displayName}</span>
                </div>
                <button onClick={logout} className="p-2 hover:text-neon-magenta transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="neon-button text-xs py-1">
                Access System
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b border-white/10 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 font-mono text-sm uppercase">Catalog</Link>
              {userProfile && (
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 font-mono text-sm uppercase">My Garage</Link>
              )}
              {userProfile?.role === 'admin' && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 font-mono text-sm uppercase">Admin</Link>
              )}
              {!userProfile && (
                <button onClick={() => { signInWithGoogle(); setIsOpen(false); }} className="w-full text-left px-3 py-2 font-mono text-sm uppercase text-neon-cyan">Access System</button>
              )}
              {userProfile && (
                <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-left px-3 py-2 font-mono text-sm uppercase text-neon-magenta">Logout</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Pages
const Catalog = () => {
  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl font-mono font-black tracking-tighter mb-2">
          <GlitchText text="AVAILABLE_UNITS" />
        </h1>
        <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Select your high-performance machine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {INITIAL_CARS.map((car) => (
          <motion.div
            key={car.id}
            whileHover={{ y: -5 }}
            className="neon-card group"
          >
            <div className="relative aspect-video mb-4 overflow-hidden">
              <img 
                src={car.image} 
                alt={car.model} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
              <div className="absolute bottom-2 left-2">
                <span className="bg-neon-cyan text-black px-2 py-0.5 text-[10px] font-bold uppercase">In Stock</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-mono font-bold mb-2 tracking-tight">{car.model}</h3>
            <p className="text-white/60 text-sm mb-4 h-12 overflow-hidden">{car.description}</p>
            
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-mono text-neon-cyan">${car.price.toLocaleString()}</span>
              <div className="flex space-x-2">
                {car.specs && Object.entries(car.specs).slice(0, 2).map(([key, val]) => (
                  <div key={key} className="text-[10px] uppercase border border-white/20 px-1.5 py-0.5 opacity-50">
                    {val}
                  </div>
                ))}
              </div>
            </div>

            <Link to={`/book/${car.id}`} className="neon-button w-full text-center block">
              Initiate Booking
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const BookingPage = ({ userProfile }: { userProfile: UserProfile | null }) => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const car = INITIAL_CARS.find(c => c.id === carId);
  const [loading, setLoading] = useState(false);

  if (!car) return <div>Car not found</div>;

  const handleBook = async () => {
    if (!userProfile) {
      signInWithGoogle();
      return;
    }

    setLoading(true);
    try {
      const deliveryDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      const bookingData: Booking = {
        id: Math.random().toString(36).substr(2, 9),
        userId: userProfile.uid,
        carId: car.id,
        status: 'pending',
        amount: car.price,
        deliveryDate,
        deliveryTime: '14:00',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      navigate('/dashboard');
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <div className="neon-card grid md:grid-cols-2 gap-8">
        <div>
          <img src={car.image} alt={car.model} className="w-full rounded border border-white/10" />
          <div className="mt-4 space-y-2">
            {car.specs && Object.entries(car.specs).map(([key, val]) => (
              <div key={key} className="flex justify-between border-b border-white/5 py-1">
                <span className="text-xs uppercase opacity-40">{key}</span>
                <span className="text-xs font-mono">{val}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-4xl font-mono font-black mb-4 tracking-tighter">{car.model}</h2>
            <p className="text-white/60 mb-6">{car.description}</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/10">
                <span className="text-xs uppercase opacity-60">Base Price</span>
                <span className="text-xl font-mono text-neon-cyan">${car.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/10">
                <span className="text-xs uppercase opacity-60">Est. Delivery</span>
                <span className="text-sm font-mono">14 Standard Days</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleBook}
            disabled={loading}
            className="neon-button w-full py-4 text-lg"
          >
            {loading ? 'PROCESSING...' : 'CONFIRM RESERVATION'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ userProfile }: { userProfile: UserProfile | null }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    const q = query(collection(db, 'bookings'), where('userId', '==', userProfile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const b = snapshot.docs.map(doc => ({ ...doc.data() } as Booking));
      setBookings(b.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  if (!userProfile) return <div className="pt-32 text-center font-mono">PLEASE AUTHENTICATE TO VIEW GARAGE</div>;

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-mono font-black mb-8 tracking-tighter">
        <GlitchText text="MY_GARAGE" />
      </h1>

      {loading ? (
        <div className="text-center py-20 font-mono animate-pulse">SCANNING DATABASE...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10">
          <p className="opacity-40 font-mono mb-4">NO ACTIVE RESERVATIONS FOUND</p>
          <Link to="/" className="neon-button">Browse Catalog</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const car = INITIAL_CARS.find(c => c.id === booking.carId);
            return (
              <div key={booking.id} className="neon-card flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-48 aspect-video">
                  <img src={car?.image} className="w-full h-full object-cover rounded" alt="" />
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-mono font-bold">{car?.model}</h3>
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-bold uppercase",
                      booking.status === 'pending' && "bg-neon-yellow text-black",
                      booking.status === 'confirmed' && "bg-neon-cyan text-black",
                      booking.status === 'delivered' && "bg-green-500 text-white",
                      booking.status === 'delayed' && "bg-neon-magenta text-white"
                    )}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-neon-cyan" />
                      <div>
                        <p className="text-[10px] opacity-40 uppercase">Delivery Date</p>
                        <p className="text-xs font-mono">{booking.deliveryDate || 'TBD'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-neon-magenta" />
                      <div>
                        <p className="text-[10px] opacity-40 uppercase">Time</p>
                        <p className="text-xs font-mono">{booking.deliveryTime || 'TBD'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-[10px] opacity-40 uppercase">Amount Paid</p>
                        <p className="text-xs font-mono">${booking.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-neon-yellow" />
                      <div>
                        <p className="text-[10px] opacity-40 uppercase">Tracking ID</p>
                        <p className="text-xs font-mono">#{booking.id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  {booking.status === 'delayed' && (
                    <div className="bg-neon-magenta/10 border border-neon-magenta p-3 text-[10px] font-mono text-neon-magenta mb-4">
                      SYSTEM ALERT: LOGISTICS DELAY DETECTED. RECALIBRATING DELIVERY WINDOW.
                    </div>
                  )}
                  <button className="neon-button w-full text-xs py-2 opacity-50 cursor-not-allowed">
                    Track Real-Time
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AdminPanel = ({ userProfile }: { userProfile: UserProfile | null }) => {
  const [allBookings, setAllBookings] = useState<(Booking & { docId: string })[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile || userProfile.role !== 'admin') {
      navigate('/');
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      setAllBookings(snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id } as Booking & { docId: string })));
    });

    return () => unsubscribe();
  }, [userProfile]);

  const updateStatus = async (docId: string, status: Booking['status']) => {
    await updateDoc(doc(db, 'bookings', docId), { status });
  };

  const updateDelivery = async (docId: string, date: string, time: string) => {
    await updateDoc(doc(db, 'bookings', docId), { deliveryDate: date, deliveryTime: time });
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-mono font-black mb-8 tracking-tighter text-neon-magenta">
        <GlitchText text="SYSTEM_OVERRIDE" />
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/20">
              <th className="p-4 text-left uppercase opacity-40">Booking ID</th>
              <th className="p-4 text-left uppercase opacity-40">User</th>
              <th className="p-4 text-left uppercase opacity-40">Car</th>
              <th className="p-4 text-left uppercase opacity-40">Status</th>
              <th className="p-4 text-left uppercase opacity-40">Delivery Config</th>
              <th className="p-4 text-left uppercase opacity-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allBookings.map((b) => (
              <tr key={b.docId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">#{b.id}</td>
                <td className="p-4 opacity-60">{b.userId.substring(0, 8)}...</td>
                <td className="p-4">{INITIAL_CARS.find(c => c.id === b.carId)?.model}</td>
                <td className="p-4">
                  <select 
                    value={b.status} 
                    onChange={(e) => updateStatus(b.docId, e.target.value as any)}
                    className="bg-black border border-white/20 p-1 text-[10px]"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <input 
                      type="date" 
                      value={b.deliveryDate || ''} 
                      onChange={(e) => updateDelivery(b.docId, e.target.value, b.deliveryTime || '')}
                      className="bg-black border border-white/20 p-1"
                    />
                    <input 
                      type="time" 
                      value={b.deliveryTime || ''} 
                      onChange={(e) => updateDelivery(b.docId, b.deliveryDate || '', e.target.value)}
                      className="bg-black border border-white/20 p-1"
                    />
                  </div>
                </td>
                <td className="p-4">
                  <button className="text-neon-cyan hover:underline">View Logs</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || 'Pilot',
            photoURL: user.photoURL || '',
            role: user.email === 'nssubramanya7005@gmail.com' ? 'admin' : 'customer'
          };
          await setDoc(doc(db, 'users', user.uid), newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-mono text-neon-cyan animate-pulse">BOOTING SYSTEM...</div>;

  return (
    <Router>
      <div className="min-h-screen relative">
        <div className="crt-overlay" />
        <div className="scanline" />
        
        <Navbar userProfile={userProfile} />
        
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/book/:carId" element={<BookingPage userProfile={userProfile} />} />
            <Route path="/dashboard" element={<Dashboard userProfile={userProfile} />} />
            <Route path="/admin" element={<AdminPanel userProfile={userProfile} />} />
          </Routes>
        </main>

        <footer className="py-12 border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="font-mono text-[10px] opacity-20 tracking-[0.5em] uppercase">
              © 2026 NEON-BENZ CORP // ALL RIGHTS RESERVED // ENCRYPTED CONNECTION
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

