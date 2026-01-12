import React, { useState } from 'react';
import { usePathname } from 'next/navigation'; // Add this import
import { 
  Monitor, 
  UserPlus, 
  CreditCard,
  FileText, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onExpandedChange?: (isExpanded: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  className, 
  onLogout, 
  isMobileOpen, 
  onMobileClose, 
  onExpandedChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname(); // Get current pathname

  const menuItems = [
    {
      icon: Monitor,
      label: 'Dashboard',
      href: '/home'
    },
    {
      icon: UserPlus,
      label: 'Create Account',
      href: '/create-account'
    },
    {
      icon: CreditCard,
      label: 'Bin Card',
      href: '/admin/bincard'
    },
    {
      icon: FileText,
      label: 'Transaction Log',
      href: '/admin/transactionlog'
    }
  ];

  // Helper function to check if a menu item is active
  const isActive = (href: string): boolean => {
    // Exact match for most routes
    if (pathname === href) {
      return true;
    }
    // For routes that might have sub-paths, check if pathname starts with href
    // This handles cases like /admin/bincard/123 matching /admin/bincard
    if (href !== '/home' && pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  const toggleSidebar = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      <div 
        className={`bg-[#F6F9FF] fixed left-0 z-50 transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[300px]' : 'w-16'
        } flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${className}`}
        style={{ 
          top: '70px', 
          height: 'calc(100vh - 70px)' 
        }}
      >
        {/* Header with toggle button */}
        <div className="p-4 flex items-center justify-end border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            {isExpanded ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <li key={index}>
                  <a
                    href={item.href}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 group relative ${
                      active
                        ? 'bg-white shadow-sm text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-white hover:shadow-sm hover:text-blue-600'
                    }`}
                    onClick={onMobileClose}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                    {isExpanded && (
                      <span className="ml-3 text-sm font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                    {!isExpanded && (
                      <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center p-3 w-full rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-red-600 group relative"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="ml-3 text-sm font-medium">Logout</span>
            )}
            {!isExpanded && (
              <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
    </>
  );
};

export default Sidebar;