import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F9F7] text-[#17211D]">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F7F9F7]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
