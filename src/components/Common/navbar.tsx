'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, User, Menu, X, ChevronDown } from 'lucide-react';
import { Employee } from '@/types/user';

interface NavbarProps {
  className?: string;
  onMenuClick?: () => void;
  currentUser?: Omit<Employee, 'Password'> | null;
}

const Navbar: React.FC<NavbarProps> = ({ className, onMenuClick, currentUser }) => {
  // Initialize theme state by checking if dark class is already applied (from blocking script)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // This runs only on initial render, checking the DOM directly
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Sync theme state with localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    
    // Ensure DOM matches localStorage
    const hasDarkClass = document.documentElement.classList.contains('dark');
    if (isDark !== hasDarkClass) {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    setIsDarkMode(isDark);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Helper function to get role name from RoleID
  const getRoleName = (roleID: number): string => {
    switch (roleID) {
      case 1:
        return 'SuperAdmin'
      case 2:
        return 'Admin'
      case 3:
        return 'StockKeeper'
      default:
        return `Role ${roleID}`
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  return (
    <nav className={`bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700 fixed top-0 left-0 right-0 z-40 h-[70px] w-full ${className}`}>
      <div className="px-6 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left side - Logo and Mobile Menu Button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick || toggleMobileMenu}
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 mr-3"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
                EXELK Inventory
              </h1>
            </div>
          </div>

          {/* Right side - Dark Mode Toggle and User Profile */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* User Profile with Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                {/* User Info - Hidden on small screens */}
                {currentUser && (
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentUser.UserName || 'User'}
                    </p>
                    
                  </div>
                )}

                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 dark:bg-indigo-600 text-white text-sm font-medium">
                    {currentUser?.UserName ? currentUser.UserName[0].toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'transform rotate-180' : ''}`} />
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && currentUser && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-4 z-50">
                  {/* Profile Header */}
                  <div className="px-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 dark:bg-indigo-600 text-white text-lg font-medium">
                        {currentUser.UserName ? currentUser.UserName[0].toUpperCase() : <User className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {currentUser.UserName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {currentUser.Email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="px-4 pt-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Role
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentUser.RoleID ? getRoleName(currentUser.RoleID) : 'No Role'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {currentUser.Email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Employee ID
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {String(currentUser.EmployeeID || 0).padStart(3, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shadow-lg">
          <div className="px-4 py-3 space-y-3">
            {currentUser && (
              <div className="border-b border-gray-200 dark:border-slate-700 pb-3">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 dark:bg-indigo-600 text-white text-sm font-medium">
                    {currentUser.UserName ? currentUser.UserName[0].toUpperCase() : <User className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {currentUser.UserName || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {currentUser.RoleID ? getRoleName(currentUser.RoleID) : 'No Role'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-13">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {currentUser.Email || 'No email'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Employee ID</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {String(currentUser.EmployeeID || 0).padStart(3, '0')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Add any mobile menu items here */}
            <div className="pt-2">
              <button
                onClick={toggleDarkMode}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-5 w-5 mr-3" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 mr-3" />
                    Dark Mode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;