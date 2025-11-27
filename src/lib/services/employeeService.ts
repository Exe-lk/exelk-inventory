import { Employee, Role } from '@/types/user'

export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await fetch('/api/employee', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.employees || []
  } catch (error) {
    console.error('Error fetching employees:', error)
    throw error
  }
}

export const fetchRoles = async (): Promise<Role[]> => {
  try {
    const response = await fetch('/api/roles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.roles || []
  } catch (error) {
    console.error('Error fetching roles:', error)
    throw error
  }
}

export const createEmployee = async (employee: Omit<Employee, 'EmployeeID' | 'CreatedDate'>): Promise<Employee> => {
  try {
    const response = await fetch('/api/employee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...employee,
        CreatedDate: new Date().toISOString()
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.employee
  } catch (error) {
    console.error('Error creating employee:', error)
    throw error
  }
}

export const updateEmployee = async (employee: Employee): Promise<Employee> => {
  try {
    const response = await fetch('/api/employee', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.employee
  } catch (error) {
    console.error('Error updating employee:', error)
    throw error
  }
}

export const deleteEmployee = async (employeeId: number): Promise<void> => {
  try {
    const response = await fetch(`/api/employee?id=${employeeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error('Error deleting employee:', error)
    throw error
  }
}