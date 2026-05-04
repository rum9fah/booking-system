'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import BookingModal from './BookingModal';

interface Booking {
  booked_date: string;
  booked_shift: string;
  pool: string;
}

interface PriceRule {
  Pool: string;
  Price: number;
  Date: string;
}

export default function PoolBookingPage() {
  const [currentPool, setCurrentPool] = useState('Pool 1'); // Updated name
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [pricingRules, setPricingRules] = useState<PriceRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res1, res2, res3, pricingRes] = await Promise.all([
        supabase.from('Pool 1').select('booked_date, booked_shift').eq('status', 'approved'),
        supabase.from('Pool 2').select('booked_date, booked_shift').eq('status', 'approved'),
        supabase.from('Pool 3').select('booked_date, booked_shift').eq('status', 'approved'),
        supabase.from('Pricing').select('*')
      ]);

      const combined: Booking[] = [
        ...(res1.data || []).map(b => ({ ...b, pool: 'Pool 1' })),
        ...(res2.data || []).map(b => ({ ...b, pool: 'Pool 2' })),
        ...(res3.data || []).map(b => ({ ...b, pool: 'Pool 3' }))
      ];

      setAllBookings(combined);
      if (pricingRes.data) setPricingRules(pricingRes.data);
    } catch (e) {
      console.error("Database Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calendarData = useMemo(() => {
    const data: Record<string, { count: number, shifts: string[] }> = {};
    allBookings.filter(b => b.pool === currentPool).forEach(b => {
      const dateKey = b.booked_date;
      if (!data[dateKey]) data[dateKey] = { count: 0, shifts: [] };
      data[dateKey].count++;
      data[dateKey].shifts.push(b.booked_shift.toLowerCase().trim());
    });
    return data;
  }, [allBookings, currentPool]);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const getPrice = useCallback((day: number, shift: 'morning' | 'evening'): number => {
    const date = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = date.getDay();
    const isWeekend = (dayOfWeek === 4 && shift === 'evening') || (dayOfWeek === 5) || (dayOfWeek === 6 && shift === 'morning');

    const specific = pricingRules.find(p => p.Pool === currentPool && p.Date === dateKey);
    if (specific) return specific.Price;

    if (isWeekend) {
      const weekend = pricingRules.find(p => p.Pool === currentPool && p.Date === 'WEEKEND');
      if (weekend) return weekend.Price;
    }

    const def = pricingRules.find(p => p.Pool === currentPool && p.Date === 'DEFAULT');
    return def ? def.Price : 70;
  }, [currentPool, year, month, pricingRules]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-[#f1f5f9] font-sans text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing...</div>;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <main className="flex items-start sm:items-center justify-center min-h-screen p-4 bg-[#f1f5f9] font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex p-3 bg-slate-50 gap-2">
          {['Pool 1', 'Pool 2', 'Pool 3'].map((pool) => ( // Updated names
            <button key={pool} onClick={() => setCurrentPool(pool)} 
              className={`flex-1 py-3.5 rounded-2xl text-[10px] font-[900] uppercase tracking-widest transition-all ${currentPool === pool ? 'bg-[#0f172a] text-white' : 'text-slate-400 hover:bg-black hover:text-white'}`}>
              {pool}
            </button>
          ))}
        </div>

        <div className="p-8 pt-14 pb-10 text-center">
          <span className="text-[10px] font-[800] tracking-[0.5em] uppercase text-[#0d9488] mb-6 block">Reservation</span>
          <h1 className="text-5xl font-[900] leading-none tracking-tight text-[#0f172a] mb-10">{currentPool}</h1>
          <div className="flex items-center justify-between px-4 max-w-[280px] mx-auto">
            <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 hover:bg-black hover:text-white transition-all font-bold">‹</button>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">{monthNames[month]} {year}</p>
            <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 hover:bg-black hover:text-white transition-all font-bold">›</button>
          </div>
        </div>

        <div className="px-8 pb-12">
          <div className="grid grid-cols-7 mb-6 text-center text-[10px] font-[800] text-slate-300 uppercase tracking-widest">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-2.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const stats = calendarData[dKey] || { count: 0 };
              const isFull = stats.count >= 2;
              return (
                <button key={day} disabled={isFull} onClick={() => { setSelectedDay(day); setIsModalOpen(true); }}
                  className={`flex flex-col items-center justify-center rounded-2xl min-h-[58px] transition-all border ${isFull ? 'opacity-20 bg-slate-100 border-transparent cursor-not-allowed' : 'bg-slate-50/50 border-slate-100 hover:bg-[#0f172a] hover:text-white group'}`}>
                  <span className="text-[15px] font-[800]">{day}</span>
                  <span className={`text-[8px] font-[900] uppercase mt-1 tracking-tighter ${stats.count === 1 ? 'text-red-500 font-black' : 'opacity-60'}`}>
                    {isFull ? 'FULL' : (stats.count === 1 ? '1 LEFT' : 'M/E')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); loadData(); }} 
        selectedDateKey={selectedDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` : ''}
        poolName={currentPool} 
        bookedShifts={calendarData[selectedDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` : '']?.shifts || []}
        prices={{ morning: getPrice(selectedDay || 1, 'morning'), evening: getPrice(selectedDay || 1, 'evening') }} 
      />
    </main>
  );
}