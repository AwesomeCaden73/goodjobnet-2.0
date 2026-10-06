import { Home, BriefcaseBusiness, Users, CircleHelp, LayoutGrid, ClipboardCheck, Settings, Plus } from 'lucide-react';
export const apps = [
  { title: 'Home', path: '/', icon: Home, color: 'purple', description: 'Your employment workspace, all together.' },
  { title: 'Jobs', path: '/hot-job-search', icon: BriefcaseBusiness, color: 'blue', description: 'Find opportunities by company, type, and location.' },
  { title: 'Job seekers', path: '/job-seeker-search', icon: Users, color: 'teal', private: true, description: 'Find people and connect them with the right opportunities.' },
  { title: 'Review', path: '/hot-jobs-review', icon: ClipboardCheck, color: 'orange', private: true, description: 'Verify opportunities and keep the job bank current.' },
  { title: 'Create', path: '/create', icon: Plus, color: 'purple', private: true, description: 'Share a job opportunity or add a job seeker.' },
  { title: 'Administration', path: '/admin-page', icon: Settings, color: 'blue', private: true, adminOnly: true, description: 'Review submissions, import lists, and manage job bank tools.' },
  { title: 'Help', path: '/help', icon: CircleHelp, color: 'purple', description: 'Find guidance, employment services, and contact information.' },
];
export const launcher = { title: 'Apps', path: '/apps', icon: LayoutGrid };
export const visibleApps = (user) => apps.filter(app => !app.private || (user && (!app.adminOnly || user.role === 'admin')));
