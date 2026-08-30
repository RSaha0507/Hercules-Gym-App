import React, { useState } from 'react';
import { GymProvider, useGym } from './context/GymContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MembersView } from './components/MembersView';
import { ApprovalsView } from './components/ApprovalsView';
import { AttendanceView } from './components/AttendanceView';
import { ShopView } from './components/ShopView';
import { WorkoutsDietView } from './components/WorkoutsDietView';
import { MessagesView } from './components/MessagesView';
import { PaymentsView } from './components/PaymentsView';
import { ProfileView } from './components/ProfileView';
import { QrModal } from './components/QrModal';
import { AuthModal } from './components/AuthModal';

const MainLayout: React.FC = () => {
  const { activeTab, theme } = useGym();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-900'
    }`}>
      {/* Top Navigation Bar */}
      <Navbar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView onOpenQrModal={() => setIsQrModalOpen(true)} />}
          {activeTab === 'members' && <MembersView />}
          {activeTab === 'approvals' && <ApprovalsView />}
          {activeTab === 'attendance' && <AttendanceView onOpenQrModal={() => setIsQrModalOpen(true)} />}
          {activeTab === 'workouts' && <WorkoutsDietView />}
          {activeTab === 'shop' && <ShopView />}
          {activeTab === 'messages' && <MessagesView />}
          {activeTab === 'revenues' && <PaymentsView />}
          {activeTab === 'profile' && <ProfileView />}
        </main>
      </div>

      {/* Global Modals */}
      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <GymProvider>
      <MainLayout />
    </GymProvider>
  );
}

export default App;
