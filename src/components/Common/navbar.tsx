'use client'

import React, { useState, useEffect } from 'react';
import { Moon, Sun, User, Menu, X } from 'lucide-react';
import { Employee } from '@/types/user';

interface NavbarProps {
  className?: string;
  onMenuClick?: () => void;
  currentUser?: Omit<Employee, 'Password'> | null;
}

const Navbar: React.FC<NavbarProps> = ({ className, onMenuClick, currentUser }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check for saved theme preference or default to light mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  return (
    <nav className={`bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 h-[70px] w-full ${className}`}>
      <div className="px-6 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left side - Logo and Mobile Menu Button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick || toggleMobileMenu}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 mr-3"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                EXELK Inventory
              </h1>
            </div>
          </div>

          {/* Right side - Dark Mode Toggle and User Profile */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              {/* User Info - Hidden on small screens */}
              {currentUser && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.UserName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentUser.RoleID ? getRoleName(currentUser.RoleID) : 'No Role'}
                  </p>
                </div>
              )}

              {/* User Avatar */}
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
                {currentUser?.UserName ? currentUser.UserName[0].toUpperCase() : <User className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-3">
            {currentUser && (
              <div className="border-b border-gray-200 pb-3">
                <p className="text-base font-medium text-gray-900">
                  {currentUser.UserName || 'User'}
                </p>
                <p className="text-sm text-gray-500">
                  {currentUser.RoleID ? getRoleName(currentUser.RoleID) : 'No Role'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {currentUser.Email || 'No email'}
                </p>
              </div>
            )}
            
            {/* Add any mobile menu items here */}
            <div className="pt-2">
              <button
                onClick={toggleDarkMode}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
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