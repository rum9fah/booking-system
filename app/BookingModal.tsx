'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BookingModalProps {
  isOpen: boolean; 
  onClose: () => void; 
  selectedDateKey: string;
  poolName: string; 
  bookedShifts: string[]; 
  prices: { morning: number; evening: number };
}

export default function BookingModal({ isOpen, onClose, selectedDateKey, poolName, bookedShifts = [], prices }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [shift, setShift] = useState<'morning' | 'evening'>('morning');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1); 
      setPhone(''); 
      setIsLoading(false);
      const taken = bookedShifts.map(s => s.toLowerCase().trim());
      // Logic to auto-select the available shift
      if (taken.includes('morning')) setShift('evening');
      else setShift('morning');
    }
  }, [isOpen, selectedDateKey, poolName, bookedShifts]);

  if (!isOpen) return null;

  const handleFinalize = async () => {
    if (!phone.trim()) return alert("Please enter your number");
    setIsLoading(true);
    try {
      // 1. Insert into the dynamic table name (Marina, Raghad, or Raneem)
      const { error } = await supabase.from(poolName).insert([{ 
        booked_date: selectedDateKey, 
        booked_shift: shift.charAt(0).toUpperCase() + shift.slice(1), 
        phone: phone.trim(), 
        status: 'pending' 
      }]);
      
      if (error) throw error;

      // 2. Format WhatsApp Message
      const waMsg = encodeURIComponent(`*New Booking Request*\n\n*Pool:* ${poolName}\n*Date:* ${selectedDateKey}\n*Shift:* ${shift.toUpperCase()}\n*Price:* ${prices[shift]} BD\n*Phone:* ${phone}`);
      
      // 3. Redirect to the NEW WhatsApp number
      window.location.href = `https://wa.me/97336653326?text=${waMsg}`;
      
    } catch (e: any) {
      alert("Error saving booking: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-md" onClick={onClose} />
      
      <div className={`bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-100 animate-in zoom-in duration-300 ${step === 1 ? 'overflow-hidden' : 'max-h-[90vh] overflow-y-auto scrollbar-hide'}`}>
        <button onClick={onClose} className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-black hover:text-white transition-all">✕</button>
        
        <div className="p-8 sm:p-12">
          {step === 1 ? (
            <>
              <h3 className="text-2xl font-[900] text-[#0f172a] mb-10 pr-10">Select Details</h3>
              <div className="space-y-4 mb-10">
                {['morning', 'evening'].map(s => {
                  const isTaken = bookedShifts.some(bs => bs.toLowerCase().trim() === s);
                  return (
                    <div key={s} onClick={() => !isTaken && setShift(s as any)} 
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${isTaken ? 'opacity-30 bg-slate-100' : shift === s ? 'border-[#0d9488] bg-[#f0fdfa]' : 'border-slate-100 hover:border-slate-200'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-[10px] font-[900] uppercase tracking-wider ${shift === s ? 'text-[#0d9488]' : 'text-slate-400'}`}>{s}</p>
                          <p className="text-[14px] font-bold text-[#0f172a]">{isTaken ? 'BOOKED' : s === 'morning' ? '07:00 AM — 04:00 PM' : '07:00 PM — 04:00 AM'}</p>
                        </div>
                        <span className="text-lg font-[900] text-[#0f172a]">{prices[s as 'morning'|'evening']} BD</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <input type="tel" placeholder="WhatsApp Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold mb-10 outline-none focus:border-slate-900 transition-all" />
              <button onClick={() => phone ? setStep(2) : alert("Enter number")} className="w-full bg-[#0f172a] text-white py-5 rounded-[1.5rem] font-[900] text-[12px] uppercase tracking-widest active:scale-95 transition-all">Next Step</button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-[#0d9488] rounded-full flex items-center justify-center text-white mx-auto mb-8 text-3xl font-black">✓</div>
              <h3 className="text-2xl font-[900] text-[#0f172a] mb-10">Confirm Payment</h3>
              
              <div className="bg-slate-50 p-8 rounded-[2rem] space-y-8 text-left mb-12 text-[14px] font-bold text-slate-700">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</div>
                  {/* UPDATED PHONE NUMBER HERE */}
                  <p>Pay <span className="text-[#0d9488] font-black">{prices[shift]} BD</span> to 36653326 via BenefitPay.</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</div>
                  <p>Take a screenshot of the receipt and send it to us on WhatsApp.</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</div>
                  <p>If you have any questions contact us.</p>
                </div>
              </div>

              <button disabled={isLoading} onClick={handleFinalize} className="w-full bg-black text-white py-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 active:scale-95 transition-all">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Receipt & Confirm'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}