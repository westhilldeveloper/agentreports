'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  FaHome,
  FaList,
  FaUser,
  FaBullseye,
  FaTicketAlt,
  FaCalendarAlt,
  FaSignOutAlt,
  
} from 'react-icons/fa';

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: FaHome },
    { href: '/admin/chits', label: 'Chits', icon: FaList },
    { href: '/admin/agents', label: 'Agents', icon: FaUser },
    { href: '/admin/targets', label: 'Monthly Targets', icon: FaBullseye },
    { href: '/admin/assign-tickets', label: 'Assign Tickets', icon: FaTicketAlt },
    { href: '/admin/daily-update', label: 'Daily Update', icon: FaCalendarAlt },
    { href: '/admin/reports', label: 'Reports', icon: FaCalendarAlt },
    { href: '/admin/regions', label: 'Regions', icon: FaCalendarAlt  },
{ href: '/admin/areas', label: 'Areas', icon: FaCalendarAlt  },
    
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-blue-700">
              Coinplus<span className="text-gray-500 font-light">Admin</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-gray-100">
            <button
              onClick={() => signOut({ callbackUrl: '/admin-login' })}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}