import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, SlidersHorizontal, BarChart3 } from 'lucide-react';
import customHeroImage from '../assets/image.png';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] to-slate-200">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
        
        {/* Left Column (Content) */}
        <div className="flex flex-col justify-center space-y-10 order-2 lg:order-1">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-[#0f172a] leading-[1.1] tracking-tighter">
            Make your pocket money last until <span className="text-[#10b981]">Month End.</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-600 font-medium leading-relaxed max-w-xl">
            Stop stressing about your monthly allowance. Tell our AI engine what you have and what you must spend—we handle the rest.
          </p>
          
          <div>
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center bg-[#0f172a] text-white px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 ease-in-out hover:bg-[#10b981] shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105"
            >
              Plan My Month
            </Link>
          </div>
        </div>
        
        {/* Right Column (Visual Anchor) */}
        <div className="flex items-center justify-center order-1 lg:order-2">
          <img
            src={customHeroImage}
            alt="PocketCA App Dashboard Logo"
            className="w-full h-auto max-w-xl object-contain animate-[float_6s_ease-in-out_infinite]"
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
