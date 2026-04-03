/**
 * Seed script — creates default users and sample transactions for local testing.
 *
 * Run with:  npm run seed
 */

import './src/config/env'           // validates .env first
import mongoose from 'mongoose'
import { env } from './src/config/env'
import { User } from './src/models/User'
import { Transaction } from './src/models/Transaction'

const USERS = [
  { username: 'admin',        email: 'admin@finops.local',   password: 'Admin@1234',  role: 'admin'   as const },
  { username: 'alice_analyst',email: 'alice@finops.local',   password: 'Alice@1234',  role: 'analyst' as const },
  { username: 'bob_viewer',   email: 'bob@finops.local',     password: 'Bob@12345',   role: 'viewer'  as const },
]

const TRANSACTIONS = [
  { amount: 5000,   type: 'income'  as const, category: 'Salary',        notes: 'Monthly salary',         daysAgo: 60 },
  { amount: 1200,   type: 'income'  as const, category: 'Freelance',      notes: 'Web design project',     daysAgo: 55 },
  { amount: 300,    type: 'income'  as const, category: 'Investments',    notes: 'Dividend payment',       daysAgo: 50 },
  { amount: 1200,   type: 'expense' as const, category: 'Rent',           notes: 'Monthly rent',           daysAgo: 58 },
  { amount: 85.50,  type: 'expense' as const, category: 'Utilities',      notes: 'Electricity bill',       daysAgo: 56 },
  { amount: 320,    type: 'expense' as const, category: 'Groceries',      notes: 'Weekly groceries',       daysAgo: 54 },
  { amount: 60,     type: 'expense' as const, category: 'Transport',      notes: 'Monthly bus pass',       daysAgo: 52 },
  { amount: 200,    type: 'expense' as const, category: 'Entertainment',  notes: 'Streaming + dining',     daysAgo: 48 },
  { amount: 5000,   type: 'income'  as const, category: 'Salary',        notes: 'Monthly salary',         daysAgo: 30 },
  { amount: 450,    type: 'income'  as const, category: 'Freelance',      notes: 'Logo design project',    daysAgo: 25 },
  { amount: 1200,   type: 'expense' as const, category: 'Rent',           notes: 'Monthly rent',           daysAgo: 28 },
  { amount: 90,     type: 'expense' as const, category: 'Utilities',      notes: 'Water + internet',       daysAgo: 26 },
  { amount: 280,    type: 'expense' as const, category: 'Groceries',      notes: 'Supermarket run',        daysAgo: 20 },
  { amount: 55,     type: 'expense' as const, category: 'Health',         notes: 'Pharmacy',               daysAgo: 15 },
  { amount: 400,    type: 'expense' as const, category: 'Shopping',       notes: 'Clothing haul',          daysAgo: 10 },
  { amount: 150,    type: 'income'  as const, category: 'Investments',    notes: 'Stock dividend',         daysAgo: 5  },
  { amount: 75,     type: 'expense' as const, category: 'Transport',      notes: 'Fuel',                   daysAgo: 3  },
  { amount: 40,     type: 'expense' as const, category: 'Entertainment',  notes: 'Cinema tickets',         daysAgo: 1  },
]

const daysAgo = (n: number): Date => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function seed() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(env.MONGO_URI)
  console.log('Connected.\n')

  // ── Users
  let adminUser: (typeof USERS)[0] & { _id?: string } = USERS[0]
  let adminId: string | undefined

  for (const u of USERS) {
    const existing = await User.findOne({ username: u.username })
    if (existing) {
      console.log(`  [skip] User "${u.username}" already exists`)
      if (u.role === 'admin') adminId = (existing._id as any).toString()
      continue
    }
    const created = await User.create(u)
    console.log(`  [+]    Created user "${u.username}" (${u.role})`)
    if (u.role === 'admin') adminId = (created._id as any).toString()
  }

  // ── Transactions (only if none exist)
  const existingCount = await Transaction.countDocuments()
  if (existingCount > 0) {
    console.log(`\n  [skip] ${existingCount} transactions already exist`)
  } else if (adminId) {
    const txDocs = TRANSACTIONS.map((t) => ({
      amount:    t.amount,
      type:      t.type,
      category:  t.category,
      notes:     t.notes,
      date:      daysAgo(t.daysAgo),
      createdBy: adminId,
    }))
    await Transaction.insertMany(txDocs)
    console.log(`\n  [+] Created ${txDocs.length} sample transactions`)
  }

  console.log('\n─────────────────────────────────────────')
  console.log('Seed complete. Default credentials:\n')
  console.log('  Role     Username         Password')
  console.log('  ──────── ──────────────── ───────────')
  console.log('  admin    admin            Admin@1234')
  console.log('  analyst  alice_analyst    Alice@1234')
  console.log('  viewer   bob_viewer       Bob@12345')
  console.log('─────────────────────────────────────────\n')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
