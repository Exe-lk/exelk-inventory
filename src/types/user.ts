export interface Role {
  RoleID: number
  RoleName: string
  Description: string
}

export interface User {
  UserID: number
  FirstName: string
  LastName: string
  Email: string
  Phone: string
  Username: string
  Password: string
  Role: Role
  CreatedBy: number
  CreatedDate: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: Omit<User, 'Password'>
  message: string
  token?: string
}