import React, { useState } from 'react';
import { 
  Monitor, 
  UserPlus, 
  CreditCard,
  FileText, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Truck,
  Package,
  Blocks,
  Grid3X3,
  GitBranch,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Shield,
  Undo,
  Users
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

  const menuItems = [
    {
      icon: Monitor,
      label: 'Dashboard',
      href: '/home'
    },
    {
      icon: Truck,
      label: 'Stock',
      href: '/stock'
    },
    {
      icon: Package,
      label: 'Product',
      href: '/product'
    },
    {
      icon: Blocks,
      label: 'Model',
      href: '/model'
    },
    {
      icon: Grid3X3,
      label: 'Brand',
      href: '/brand'
    },
    {
      icon: GitBranch,
      label: 'Category',
      href: '/category'
    },
    {
      icon: CreditCard,
      label: 'Bin Card',
      href: '/bincard'
    },
    {
      icon: FileText,
      label: 'Transaction Log',
      href: '/transactionlog'
    },
    {
      icon: ArrowRight,
      label: 'GRN',
      href: '/grn'
    },
    {
      icon: ArrowLeft,
      label: 'GIN',
      href: '/gin'
    },
    {
      icon: FileInput,
      label: 'Import/Export Log',
      href: '/import'
    },
    {
      icon: Undo,
      label: 'Return',
      href: '/return'
    },
    {
      icon: Users,
      label: 'Suppliers',
      href: '/supplier'
    },
    {
      icon: FileText,
      label: 'API Documentation',
      href: '/swagger'
    }
  ];

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
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.href}
                  className="flex items-center p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-blue-600 group relative"
                  onClick={onMobileClose}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
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
            ))}
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