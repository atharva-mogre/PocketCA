import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-gray-100 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <img src="/Webicon.png" alt="PocketCA Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-xl text-primary tracking-tight">PocketCA</span>
        </Link>
        
        <div className="flex items-center gap-6">
          {location.pathname !== '/onboarding' && location.pathname !== '/dashboard' && (
            <Link 
              to="/onboarding" 
              className="bg-primary hover:bg-primary-light text-white px-5 py-2 rounded-full font-medium transition-colors text-sm"
            >
              Plan My Month
            </Link>
          )}
          {location.pathname === '/dashboard' && (
             <Link 
              to="/onboarding" 
              className="text-primary font-medium hover:text-primary-light transition-colors text-sm"
             >
               Reset Budget
             </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
