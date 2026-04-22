'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Lock, ArrowRight, ShieldCheck, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuth(password, data.role);
        toast.success(`Logged in as ${data.role === 'admin' ? 'Administrator' : 'Viewer'}`);
        router.push('/dashboard');
      } else {
        toast.error('Invalid password. Please try again.');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-100/40 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[420px] z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 border border-slate-100 mb-6">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Vendex Intelligence</h1>
          <p className="text-slate-500 font-medium text-sm">Secure Portal Access</p>
        </div>

        <Card className="border-white/50 bg-white/70 backdrop-blur-2xl shadow-[0_20px_50px_rgba(79,70,229,0.1)] rounded-[2rem] overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center space-y-2">
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-slate-500">
              Please enter your security credentials to unlock the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    type="password"
                    placeholder="Security Password"
                    className="pl-12 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-indigo-500/20 focus:border-indigo-500 h-14 rounded-2xl transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Unlock Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between gap-4 mb-4">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available Roles</span>
                 <div className="h-px bg-slate-100 flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Admin</span>
                  <span className="text-[10px] text-slate-500 font-medium">Full Write Access</span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Viewer</span>
                  <span className="text-[10px] text-slate-500 font-medium">Read-Only Mode</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-10 flex flex-col items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur rounded-full border border-slate-100 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Status: Operational</span>
           </div>
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
             &copy; 2026 Vendex Secure Cloud
           </p>
        </div>
      </div>
    </div>
  );
}
