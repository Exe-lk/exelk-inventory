import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Employee, hasAdminAccess, isStockKeeper } from '@/types/user';

interface UseRoleProtectionProps {
  currentUser: Omit<Employee, 'Password'> | null;
  requiredRoles: ('admin' | 'stockkeeper')[];
  redirectTo?: string;
}

export const useRoleProtection = ({
  currentUser,
  requiredRoles,
  redirectTo = '/home'
}: UseRoleProtectionProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) return;

    const userRoleID = currentUser.RoleID;
    let hasAccess = false;

    // Check if user has required role access
    if (requiredRoles.includes('admin') && hasAdminAccess(userRoleID)) {
      hasAccess = true;
    }
    if (requiredRoles.includes('stockkeeper') && isStockKeeper(userRoleID)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      router.push(redirectTo);
    }
  }, [currentUser, requiredRoles, redirectTo, router]);

  return currentUser ? {
    hasAccess: requiredRoles.some(role => 
      (role === 'admin' && hasAdminAccess(currentUser.RoleID)) ||
      (role === 'stockkeeper' && isStockKeeper(currentUser.RoleID))
    ),
    isAdmin: hasAdminAccess(currentUser.RoleID),
    isStockKeeper: isStockKeeper(currentUser.RoleID)
  } : null;
};