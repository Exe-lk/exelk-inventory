import React from 'react';
import AdminSidebar from '@/components/Admin/sidebar';
import CommonSidebar from '@/components/Common/sidebar';
import { Employee, hasAdminAccess, isStockKeeper, isSuperAdmin, isAdmin } from '@/types/user';

interface SidebarWrapperProps {
  currentUser: Omit<Employee, 'Password'> | null;
  onLogout: () => Promise<void>;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onExpandedChange: (isExpanded: boolean) => void;
}

const SidebarWrapper: React.FC<SidebarWrapperProps> = ({
  currentUser,
  onLogout,
  isMobileOpen,
  onMobileClose,
  onExpandedChange
}) => {
  // If no user, return null or a default sidebar
  if (!currentUser) {
    return null;
  }

  // Check user role and render appropriate sidebar
  if (isSuperAdmin(currentUser.RoleID) || isAdmin(currentUser.RoleID)) {
    // SuperAdmin or Admin - use Admin sidebar
    return (
      <AdminSidebar
        onLogout={onLogout}
        isMobileOpen={isMobileOpen}
        onMobileClose={onMobileClose}
        onExpandedChange={onExpandedChange}
      />
    );
  } else if (isStockKeeper(currentUser.RoleID)) {
    // StockKeeper - use Common sidebar
    return (
      <CommonSidebar
        onLogout={onLogout}
        isMobileOpen={isMobileOpen}
        onMobileClose={onMobileClose}
        onExpandedChange={onExpandedChange}
      />
    );
  }

  // Default fallback (in case of unknown role)
  return (
    <CommonSidebar
      onLogout={onLogout}
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      onExpandedChange={onExpandedChange}
    />
  );
};

export default SidebarWrapper;