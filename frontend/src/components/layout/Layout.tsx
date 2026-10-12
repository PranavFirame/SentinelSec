import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface Props {
  isDemoMode?: boolean;
}

export const Layout: React.FC<Props> = ({ isDemoMode }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F9F7] text-[#17211D]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar isDemoMode={isDemoMode} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F7F9F7]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
