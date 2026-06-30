import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, SlidersHorizontal, BarChart3 } from 'lucide-react';
import customHeroImage from '../assets/image.png';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] to-slate-200">
      {/* Mobile-First Header / HUD */}
      <header className="max-w-7xl mx-auto px-6 pt-8 flex items-center justify-center md:justify-start gap-3">
        <div className="bg-[#0f172a] p-2 rounded-xl shadow-lg">
          <BrainCircuit className="w-8 h-8 text-[#10b981]" />
        </div>
        <span className="text-2xl font-black text-[#0f172a] tracking-tight">POCKET CA</span>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
        
        {/* Left Column (Content) */}
        <div className="flex flex-col justify-center text-center md:text-left space-y-8">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-[#0f172a] leading-[1.1] tracking-tighter mx-auto md:mx-0">
            Make your pocket money last until <span className="text-[#10b981]">Month End.</span>
          </h1>
          
          <p className="text-lg sm:text-2xl text-slate-600 font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
            Stop stressing about your monthly allowance. Tell our AI engine what you have and what you must spend—we handle the rest.
          </p>
          
          <div className="flex justify-center md:justify-start">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center bg-[#0f172a] text-white min-h-[48px] px-10 py-4 rounded-full font-bold text-lg sm:text-xl transition-all duration-300 ease-in-out hover:bg-[#10b981] shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105"
            >
              Plan My Month
            </Link>
          </div>
        </div>
        
        {/* Right Column (Visual Anchor) */}
        <div className="flex items-center justify-center mt-12 md:mt-0">
          <img
            src={customHeroImage}
            alt="PocketCA App Dashboard Logo"
            className="w-full h-auto max-w-sm md:max-w-xl object-contain animate-[float_6s_ease-in-out_infinite]"
          />
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BrainCircuit className="w-10 h-10 text-[#10b981]" />}
            title="Smart Allocation"
            description="Tell the app what you get and what you must spend; our AI handles the rest, splitting your flexible cash perfectly."
          />
          <FeatureCard
            icon={<SlidersHorizontal className="w-10 h-10 text-[#10b981]" />}
            title="The Flex Slider"
            description="Dynamically warp your budget in real-time based on your changing savings targets. Adjust on the fly without the math."
          />
          <FeatureCard
            icon={<BarChart3 className="w-10 h-10 text-[#10b981]" />}
            title="Reality Check"
            description="Compare your actual spending directly against your AI recommendation model at the end of the month."
          />
        </div>
      </section>

      {/* Custom Keyframes for Floating Animation */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-10 rounded-[2rem] backdrop-blur-md bg-white/70 border border-gray-100 shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full group">
    <div className="w-20 h-20 rounded-2xl bg-[#0f172a] shadow-lg flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4 text-[#0f172a] tracking-tight">{title}</h3>
    <p className="text-slate-600 text-lg leading-relaxed font-medium">{description}</p>
  </div>
);

export default LandingPage;
