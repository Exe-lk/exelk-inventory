export interface Role {
  RoleID: number
  RoleName: string
  Description: string
}

export interface Employee {
  EmployeeID: number
  Email: string
  Phone: string
  UserName: string
  Password: string
  RoleID: number
  CreatedBy: number
  CreatedDate: string
}

export interface LoginRequest {
  username: string
  password: string
}

// export interface LoginResponse {
//   success: boolean
//   employee?: Omit<Employee, 'Password'>
//   message: string
//   token?: string
// }


//edit for jwt-token (start)
export interface LoginResponse {
  success: boolean
  message: string
  data?: {
    userId: number
    username: string
    role: string
    accessToken: string
    refreshToken: string
  }
}

export interface AuthUser {
  userId: number
  username: string
  email: string
  role: string
  roleId: number
}

//edit for jwt-token (start)

export const ROLES = {
  SUPERADMIN: 1,
  ADMIN: 2,
  STOCKKEEPER: 3
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

// Helper function to check if user has admin privileges
export const hasAdminAccess = (roleID: number): boolean => {
  return roleID === 1 || roleID === 2; // SuperAdmin (1) and Admin (2)
};

// Helper function to check if user is stockkeeper
export const isStockKeeper = (roleID: number): boolean => {
  return roleID === 3; // Assuming RoleID 3 is for Stockkeeper
};

export const isSuperAdmin = (roleID: number): boolean => {
  return roleID === 1; // SuperAdmin only
};

export const isAdmin = (roleID: number): boolean => {
  return roleID === 2; // Admin only
};