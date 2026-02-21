import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
