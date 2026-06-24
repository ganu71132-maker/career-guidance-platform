import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../hooks/usePWA';
import { X, CheckCircle2, Sparkles, Smartphone, Zap, Bell, ArrowRight } from 'lucide-react';

export default function InstallPrompt() {
  const { isInstallable, showSuccess, installApp, dismissPrompt, setShowSuccess } = usePWA();

  return (
    <>
      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[9999] p-1 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-emerald-500/20 shadow-2xl backdrop-blur-2xl border border-white/20 select-none overflow-hidden"
          >
            <div className="bg-white/85 backdrop-blur-md rounded-[22px] p-5 sm:p-6 relative">
              {/* Close Button */}
              <button
                onClick={dismissPrompt}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title Section */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
                  <Sparkles className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-1.5">
                    🚀 Install Career Guidance
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Get a faster and better experience.</p>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="space-y-2.5 my-5 bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
                {[
                  { icon: <Smartphone className="h-4 w-4 text-emerald-600" />, text: 'Open like a mobile app' },
                  { icon: <Zap className="h-4 w-4 text-emerald-600" />, text: 'Faster loading speeds' },
                  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, text: 'Track career progress easily' },
                  { icon: <Zap className="h-4 w-4 text-emerald-600" />, text: 'Access career roadmaps quickly' },
                  { icon: <Bell className="h-4 w-4 text-emerald-600" />, text: 'Receive future reminders & streaks' },
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="bg-emerald-50 p-1.5 rounded-lg shrink-0">
                      {benefit.icon}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={dismissPrompt}
                  className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 transition-all cursor-pointer text-center"
                >
                  Maybe Later
                </button>
                <button
                  onClick={installApp}
                  className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer text-center hover:scale-[1.02]"
                >
                  Install App <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-md w-auto z-[99999] p-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 shadow-2xl"
          >
            <div className="bg-white/95 rounded-[14px] p-4 flex gap-3 relative pr-10">
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                <span className="text-xl">🎉</span>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Career Guidance Installed Successfully
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
                  You can now access Career Guidance directly from your home screen for a faster experience.
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="absolute top-4 right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
