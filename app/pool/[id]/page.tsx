'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import BookingModal from '@/components/BookingModal';

export default function DynamicPoolPage() {
  const params = useParams();
  const router = useRouter();
  
  // 1. Identify the Pool from the URL
  const poolSlug = params?.id as string; 
  const tableName = poolSlug ? poolSlug.charAt(0).toUpperCase() + poolSlug.slice(1) : '';

  // 2. State Management
  const [bookedDates, setBookedDates] = useState<any[]>([]);
  const [prices, setPrices] = useState({ morning: 35, evening: 45 });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState('');

  // 3. Data Fetching
  useEffect(() => {
    async function initPool() {
      if (!poolSlug) return;
      
      const validPools = ['Marina', 'Raghad', 'Raneem'];
      if (!validPools.includes(tableName)) {
        router.push('/'); 
        return;
      }

      setLoading(true);
      try {
        // Fetch bookings for THIS specific table
        const { data: bookings } = await supabase
          .from(tableName)
          .select('*')
          .neq('status', 'rejected');

        // Fetch pricing for THIS specific pool
        const { data: pricing } = await supabase
          .from('Pricing')
          .select('*')
          .eq('Pool', tableName);

        if (bookings) setBookedDates(bookings);
        if (pricing) {
          const def = pricing.find(p => p.Date === 'DEFAULT');
          if (def) setPrices({ morning: def.Price, evening: def.Price + 10 });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }

    initPool();
  }, [poolSlug, tableName, router]);

  // 4. Calendar Logic
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [currentDate]);

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateKey(dateStr);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-200 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading {tableName}...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] p-4 sm:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0d9488] mb-4 block">Private Resort</span>
          <h1 className="text-6xl sm:text-8xl font-[900] tracking-tighter text-[#0f172a]">{tableName}</h1>
        </div>

        {/* Calendar UI */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-[#0f172a]">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 hover:bg-slate-50 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 hover:bg-slate-50 rounded-full transition-colors"><ChevronRight size={20}/></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-black text-slate-300 uppercase text-center py-4">{d}</div>
              ))}
              
              {daysInMonth.map((day, idx) => {
                if (!day) return <div key={`blank-${idx}`} />;
                
                const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const bookingsForDate = bookedDates.filter(b => b.booked_date === dateKey);
                const isFull = bookingsForDate.length >= 2;

                return (
                  <button
                    key={day}
                    disabled={isFull}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center transition-all relative group
                      ${isFull ? 'bg-slate-50 opacity-20 cursor-not-allowed' : 'bg-white border border-slate-100 hover:border-[#0f172a] hover:shadow-lg'}`}
                  >
                    <span className="text-lg font-black text-[#0f172a]">{day}</span>
                    {bookingsForDate.length === 1 && (
                      <div className="absolute bottom-2 w-1.5 h-1.5 bg-[#0d9488] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal */}
        <BookingModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDateKey={selectedDateKey}
          poolName={tableName}
          prices={prices}
          bookedShifts={bookedDates
            .filter(b => b.booked_date === selectedDateKey)
            .map(b => b.booked_shift)}
        />
      </div>
    </main>
  );
}