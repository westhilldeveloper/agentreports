'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  FaHome, FaList, FaUsers, FaBullseye, FaTicketAlt, FaCalendarAlt, FaFileAlt, FaSignOutAlt 
} from 'react-icons/fa';
import { useRole } from '@/context/RoleContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const { isFullAdmin } = useRole();

  const allLinks = [
    { href: '/admin', label: 'Dashboard', icon: FaHome },
    { href: '/admin/chits', label: 'Chits', icon: FaList },
    { href: '/admin/agents', label: 'Agents', icon: FaUsers },
    { href: '/admin/targets', label: 'Monthly Targets', icon: FaBullseye },
    { href: '/admin/assign-tickets', label: 'Assign Tickets', icon: FaTicketAlt },
    { href: '/admin/daily-update', label: 'Daily Update', icon: FaCalendarAlt },
    { href: '/admin/reports', label: 'Reports', icon: FaFileAlt },
  ];
const limitedLinks = [
  { href: '/admin', label: 'Dashboard', icon: FaHome },
  { href: '/admin/reports', label: 'Reports', icon: FaFileAlt },
];
  // Manager sees only Reports and Dashboard (optional)
  const managerLinks = [
    { href: '/admin', label: 'Dashboard', icon: FaHome },
    { href: '/admin/reports', label: 'Reports', icon: FaFileAlt },
  ];

  const links = isFullAdmin ? allLinks : limitedLinks;

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen p-4 fixed">
      <h1 className="text-2xl font-bold mb-8">
        Coinplus {role === 'manager' ? 'Manager' : 'Admin'}
      </h1>
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded hover:bg-gray-700 flex items-center space-x-2 ${
                pathname === link.href ? 'bg-gray-700' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="block w-full text-left px-4 py-2 rounded hover:bg-red-600 text-red-400 hover:text-white mt-8 flex items-center space-x-2"
        >
          <FaSignOutAlt className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}