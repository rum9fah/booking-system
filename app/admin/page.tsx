'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Plus, X, Trash2, RotateCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'pricing'>('bookings');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isPoolSelectorOpen, setIsPoolSelectorOpen] = useState(false); // For custom dropdown
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [targetPool, setTargetPool] = useState('Pool 1');
  const [priceValue, setPriceValue] = useState('');
  const [dateType, setDateType] = useState<'default' | 'weekend' | 'specific'>('default');
  const [specificDate, setSpecificDate] = useState('');

  const SECRET_PIN = "1234"; 

  const fetchData = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (activeTab === 'bookings') {
        let all: any[] = [];
        const pools = ['Pool 1', 'Pool 2', 'Pool 3'];
        for (const pool of pools) {
          const { data } = await supabase.from(pool).select('*').eq('status', 'pending');
          if (data) {
            all = [...all, ...data.map(b => ({ ...b, pool, ui_key: `${pool}-${b.id}` }))];
          }
        }
        setBookings(all);
      } else {
        const { data } = await supabase.from('Pricing').select('*').order('id', { ascending: false });
        if (data) setPricingRules(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAuthorized) fetchData();
  }, [isAuthorized, activeTab, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === SECRET_PIN) setIsAuthorized(true);
    else alert("Wrong PIN");
  };

  const updateBookingStatus = async (db_id: number, pool: string, newStatus: string, ui_key: string) => {
    if (processingId) return; 
    setProcessingId(ui_key);
    try {
      const { data, error } = await supabase
        .from(pool)
        .update({ status: newStatus })
        .eq('id', db_id)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        setBookings(prev => prev.filter(b => b.ui_key !== ui_key));
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSavePrice = async () => {
    if (!priceValue) return;
    const dateLabel = dateType === 'default' ? "DEFAULT" : dateType === 'weekend' ? "WEEKEND" : specificDate;
    
    try {
      const { error } = await supabase
        .from('Pricing')
        .upsert(
          { Pool: targetPool, Price: parseFloat(priceValue), Date: dateLabel },
          { onConflict: 'Pool,Date' }
        );
      if (error) throw error;
      setIsPriceModalOpen(false);
      setPriceValue('');
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deletePrice = async (id: number) => {
    await supabase.from('Pricing').delete().eq('id', id);
    fetchData();
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 text-slate-900">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
          <h2 className="text-3xl font-black text-center mb-8">Admin Login</h2>
          <input type="password" placeholder="PIN" className="w-full p-5 bg-slate-50 rounded-2xl mb-4 text-center text-xl font-bold border-2 border-transparent focus:border-[#0f172a] outline-none" value={passcode} onChange={(e) => setPasscode(e.target.value)} autoFocus />
          <button className="w-full bg-[#0f172a] text-white py-5 rounded-2xl font-black uppercase tracking-widest">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-12 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-6 mb-12">
          {/* Tab bar stays centered or left-aligned */}
          <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] self-start">
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest ${activeTab === 'bookings' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Bookings</button>
            <button onClick={() => setActiveTab('pricing')} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest ${activeTab === 'pricing' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Pricing</button>
          </div>
          
          {/* New Rule button strictly under the tab bar */}
          {activeTab === 'pricing' && (
            <button onClick={() => setIsPriceModalOpen(true)} className="bg-[#0f172a] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 self-start shadow-xl shadow-slate-200">
              <Plus size={14} /> New Rule
            </button>
          )}
        </div>

        {activeTab === 'bookings' ? (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
             <div className="w-full max-w-[95%] mb-6 flex justify-between items-end">
                <h1 className="text-4xl font-black tracking-tight">Pending</h1>
                <button onClick={fetchData} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400">
                  <RotateCw size={20} className={isLoading ? 'animate-spin' : ''}/>
                </button>
              </div>
              
              {bookings.length === 0 && !isLoading && (
                <div className="w-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-slate-300 font-bold uppercase text-[10px] tracking-widest">No pending requests</div>
              )}

              {/* Centered and scaled by 5% */}
              <div className="w-full flex flex-col items-center gap-4">
                {bookings.map(b => (
                  <div key={b.ui_key} className={`w-full max-w-[95%] scale-[0.95] bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6 transition-all ${processingId === b.ui_key ? 'opacity-50' : ''}`}>
                    <div className="text-center sm:text-left">
                      <span className="text-[10px] font-black text-[#0d9488] bg-[#f0fdfa] px-4 py-1.5 rounded-full uppercase mb-3 inline-block">{b.pool}</span>
                      <p className="text-2xl font-black mb-1 leading-tight">{b.booked_date}</p>
                      <p className="text-slate-400 font-bold text-sm uppercase">{b.booked_shift} Shift — {b.phone}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <button disabled={!!processingId} onClick={() => updateBookingStatus(b.id, b.pool, 'approved', b.ui_key)} className="w-full sm:w-auto bg-[#0f172a] text-white px-8 py-4 rounded-2xl text-[12px] font-black uppercase flex items-center justify-center gap-2">
                        {processingId === b.ui_key ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve
                      </button>
                      <button disabled={!!processingId} onClick={() => updateBookingStatus(b.id, b.pool, 'rejected', b.ui_key)} className="w-full sm:w-auto bg-slate-100 text-slate-400 px-8 py-4 rounded-2xl text-[12px] font-black uppercase flex items-center justify-center gap-2">
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        ) : (
          <div className="grid gap-3">
             <h1 className="text-4xl font-black mb-10 tracking-tight">Pricing History</h1>
            {pricingRules.map(rule => (
              <div key={rule.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-[#0d9488] uppercase">{rule.Pool}</p>
                  <p className="font-black">{rule.Date}</p>
                </div>
                <div className="flex items-center gap-8">
                  <p className="text-sm sm:text-xl font-black">{rule.Price} BHD</p>
                  <button onClick={() => deletePrice(rule.id)} className="text-slate-200 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm" onClick={() => {setIsPriceModalOpen(false); setIsPoolSelectorOpen(false);}} />
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 relative z-10 shadow-2xl">
            <h2 className="text-3xl font-black mb-10">New Price Rule</h2>
            <div className="grid sm:grid-cols-2 gap-10">
              <div className="space-y-6">
                
                {/* --- START OF CUSTOM POOL SELECTOR --- */}
                <div className="relative">
                  <div 
                    onClick={() => setIsPoolSelectorOpen(!isPoolSelectorOpen)}
                    className="w-full bg-slate-50 p-5 rounded-2xl font-black text-slate-800 flex justify-between items-center cursor-pointer border-2 border-transparent hover:border-slate-200 transition-all"
                  >
                    <span>{targetPool}</span>
                    <ChevronDown size={20} className={`transition-transform duration-300 ${isPoolSelectorOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isPoolSelectorOpen && (
                    <div className="absolute top-[110%] left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                      {['Pool 1', 'Pool 2', 'Pool 3'].map((pool) => (
                        <div 
                          key={pool}
                          onClick={() => { setTargetPool(pool); setIsPoolSelectorOpen(false); }}
                          className={`p-5 font-black text-sm uppercase tracking-widest cursor-pointer transition-colors ${targetPool === pool ? 'bg-[#0f172a] text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          {pool}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* --- END OF CUSTOM POOL SELECTOR --- */}

                <input type="number" value={priceValue} onChange={e => setPriceValue(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xl outline-none border-2 border-transparent focus:border-[#0f172a] transition-all" placeholder="0.00" />
              </div>
              <div className="space-y-4">
                {['default', 'weekend', 'specific'].map((type) => (
                  <button key={type} onClick={() => setDateType(type as any)} className={`w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase border-2 ${dateType === type ? 'border-[#0f172a] bg-[#0f172a] text-white shadow-lg' : 'border-slate-100 text-slate-400'}`}>{type}</button>
                ))}
                {dateType === 'specific' && <input type="text" value={specificDate} onChange={e => setSpecificDate(e.target.value)} placeholder="YYYY-MM-DD" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-[#0f172a]" />}
              </div>
            </div>
            <button onClick={handleSavePrice} className="w-full mt-10 bg-[#0d9488] text-white py-6 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all">Apply Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}