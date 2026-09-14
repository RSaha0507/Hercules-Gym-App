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
import { HgAiView } from './components/HgAiView';
import { QrModal } from './components/QrModal';
import { AuthModal } from './components/AuthModal';
import { OpeningHomeScreen } from './components/OpeningHomeScreen';
import { Global3DScene } from './components/Global3DScene';

const MainLayout: React.FC = () => {
  const { activeTab, theme, currentUser } = useGym();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  React.useEffect(() => {
    if (currentUser) {
      setIsAuthModalOpen(false);
    }
  }, [currentUser]);
  
  return (
    <div className="relative min-h-screen bg-black text-zinc-100 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Permanent Global 3D Spatial Canvas Layer */}
      <Global3DScene intensity={currentUser ? 1.0 : 1.2} />

      {!currentUser ? (
        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          <OpeningHomeScreen
            onOpenLogin={() => {
              setAuthInitialMode('login');
              setIsAuthModalOpen(true);
            }}
            onOpenRegister={() => {
              setAuthInitialMode('register');
              setIsAuthModalOpen(true);
            }}
          />

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            isStandaloneView={false}
            initialMode={authInitialMode}
          />
        </div>
      ) : (
        <div className={`relative z-10 min-h-screen flex flex-col transition-colors duration-200 ${
          theme === 'dark' ? 'bg-zinc-950/30' : 'bg-black/30'
        }`}>
          {/* Top Navigation Bar with Glassmorphic Rim */}
          <div className="relative z-30">
            <Navbar
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </div>

          <div className="relative z-20 flex-1 flex w-full mx-auto px-2 sm:px-4 lg:px-6">
            {/* Left Sidebar (Desktop Quick Rail) */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 p-3 sm:p-5 lg:p-6 min-w-0 w-full overflow-y-auto">
              {activeTab === 'dashboard' && <DashboardView onOpenQrModal={() => setIsQrModalOpen(true)} />}
              {activeTab === 'members' && <MembersView />}
              {activeTab === 'approvals' && <ApprovalsView />}
              {activeTab === 'attendance' && <AttendanceView onOpenQrModal={() => setIsQrModalOpen(true)} />}
              {activeTab === 'workouts' && <WorkoutsDietView />}
              {activeTab === 'hg-ai' && <HgAiView />}
              {(activeTab === 'shop' || activeTab === 'shop/cart' || activeTab === 'cart') && <ShopView />}
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
            isStandaloneView={false}
          />
        </div>
      )}
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
