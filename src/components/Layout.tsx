import React from 'react';
import Navbar from '@/components/Navbar';

interface LayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
}

const Layout = ({ children, showNavbar = true }: LayoutProps) => {
  console.log("Layout component is rendering", { showNavbar });
  return (
    <div className="min-h-screen overflow-x-hidden">
      {showNavbar && <Navbar />}
      <div className="w-full max-w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};

export default Layout;