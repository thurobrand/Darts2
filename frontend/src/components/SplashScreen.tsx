import React from 'react';
import splashImage from '../ThurobrandsCricketDarts.jpeg';

interface SplashScreenProps {
  onContinue: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
      <div className="w-full overflow-hidden rounded-3xl border border-white/20 bg-slate-900/70 shadow-[0_30px_80px_rgba(2,6,23,0.65)] backdrop-blur-sm">
        <img
          src={splashImage}
          alt="Cricket Darts scoreboard splash"
          className="h-auto max-h-[70vh] w-full object-contain"
        />

        <div className="flex justify-center border-t border-white/10 p-4 sm:p-5">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-emerald-500"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;