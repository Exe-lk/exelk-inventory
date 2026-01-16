// import { PrismaClient } from '@prisma/client'

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const prisma = globalForPrisma.prisma ?? new PrismaClient({
//   log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'info', 'warn'] : ['error'],
//   // For Prisma 7.x, you might need additional configuration
//   // but this often requires specific adapters for different databases
// })

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prisma
// }

// export default prisma




// import { PrismaClient } from '@prisma/client'

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const prisma = globalForPrisma.prisma ?? new PrismaClient({
//   log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'info', 'warn'] : ['error'],
  
// })

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prisma
// }

// // Add graceful shutdown
// if (process.env.NODE_ENV !== 'production') {
//   process.on('beforeExit', async () => {
//     await prisma.$disconnect()
//   })
// }

// export default prisma





import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // OPTIMIZATION: Configure for serverless environments
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// OPTIMIZATION: Prevent connection exhaustion in serverless
if (process.env.NODE_ENV === 'production') {
  // In production, don't disconnect on every request
  // Connection pooling handles this
} else {
  // Only disconnect on process exit in development
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma