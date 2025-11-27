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