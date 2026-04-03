import { env } from './env'

const serverUrl =
  env.NODE_ENV === 'production'
    ? 'https://finopsbackend-production.up.railway.app'
    : `http://localhost:${env.PORT}`

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FinOps Backend API',
    version: '1.0.0',
    description:
      'Finance Data Processing and Access Control Backend. Supports three roles: **viewer** (read-only), **analyst** (read + create/update transactions), and **admin** (full access).',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    { url: serverUrl, description: env.NODE_ENV === 'production' ? 'Production' : 'Local dev' },
  ],

  // ── Reusable components
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from POST /api/auth/login',
      },
    },

    schemas: {
      // ── Shared
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
        },
      },

      // ── User
      UserPublic: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1f1f1f1f1f1f1f1f1f1f1' },
          username: { type: 'string', example: 'alice_analyst' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          role: { type: 'string', enum: ['viewer', 'analyst', 'admin'], example: 'analyst' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Transaction
      Transaction: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64b2e2e2e2e2e2e2e2e2e2e2' },
          amount: { type: 'number', format: 'float', example: 2500.0 },
          type: { type: 'string', enum: ['income', 'expense'], example: 'income' },
          category: { type: 'string', example: 'Salary' },
          date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
          notes: { type: 'string', nullable: true, example: 'Monthly salary payment' },
          createdBy: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Dashboard
      CategoryTotal: {
        type: 'object',
        properties: {
          category: { type: 'string', example: 'Salary' },
          total: { type: 'number', example: 12000.0 },
          count: { type: 'integer', example: 3 },
        },
      },
      MonthlyTrend: {
        type: 'object',
        properties: {
          year: { type: 'integer', example: 2024 },
          month: { type: 'integer', example: 1 },
          income: { type: 'number', example: 5000.0 },
          expense: { type: 'number', example: 1500.0 },
          net: { type: 'number', example: 3500.0 },
        },
      },
      DashboardSummary: {
        type: 'object',
        properties: {
          totalIncome: { type: 'number', example: 15000.0 },
          totalExpense: { type: 'number', example: 4500.0 },
          netBalance: { type: 'number', example: 10500.0 },
          transactionCount: { type: 'integer', example: 42 },
          categoryTotals: { type: 'array', items: { $ref: '#/components/schemas/CategoryTotal' } },
          recentTransactions: {
            type: 'array',
            items: { $ref: '#/components/schemas/Transaction' },
            description: 'Up to 10 most recent transactions',
          },
          monthlyTrends: {
            type: 'array',
            items: { $ref: '#/components/schemas/MonthlyTrend' },
          },
        },
      },

      // ── Paginated wrappers
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 100 },
          page: { type: 'integer', example: 1 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
    },

    // ── Reusable responses
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT token',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      Forbidden: {
        description: 'Authenticated but insufficient role',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      BadRequest: {
        description: 'Validation error or invalid input',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
    },

    // ── Reusable parameters
    parameters: {
      PageParam: {
        in: 'query',
        name: 'page',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number',
      },
      LimitParam: {
        in: 'query',
        name: 'limit',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Results per page',
      },
    },
  },

  // ── Global security: all routes require Bearer unless overridden
  security: [{ bearerAuth: [] }],

  // ── Paths
  paths: {
    // ── Health
    '/': {
      get: {
        tags: ['Health'],
        summary: 'API status check',
        security: [],
        responses: {
          '200': {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'FinOps Backend API is running' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    status: { type: 'string', example: 'healthy' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Auth
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        description:
          'Creates a new user account. Role is always **viewer** — role elevation requires an admin.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 50,
                    pattern: '^[a-zA-Z0-9_]+$',
                    example: 'alice_doe',
                  },
                  email: { type: 'string', format: 'email', example: 'alice@example.com' },
                  password: { type: 'string', minLength: 8, example: 'SecurePass1' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserPublic' },
                        token: { type: 'string', example: 'eyJhbGci...' },
                      },
                      description: 'auth register/login wraps user+token together',
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { description: 'Username or email already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'alice_doe' },
                  password: { type: 'string', example: 'SecurePass1' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserPublic' },
                        token: { type: 'string', example: 'eyJhbGci...' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { description: 'Invalid username or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Account is deactivated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    // ── Users
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: "Get own profile",
        description: 'Returns the authenticated user\'s profile. Available to all roles.',
        responses: {
          '200': {
            description: 'Own user profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserPublic' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (admin only)',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
        ],
        responses: {
          '200': {
            description: 'Paginated user list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      allOf: [
                        { $ref: '#/components/schemas/PaginationMeta' },
                        {
                          type: 'object',
                          properties: {
                            users: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user with any role (admin only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password', 'role'],
                properties: {
                  username: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$', example: 'bob_analyst' },
                  email: { type: 'string', format: 'email', example: 'bob@example.com' },
                  password: { type: 'string', minLength: 8, example: 'SecurePass1' },
                  role: { type: 'string', enum: ['viewer', 'analyst', 'admin'], example: 'analyst' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserPublic' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': { description: 'Username or email already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID (admin only)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, example: '64a1f1f1f1f1f1f1f1f1f1f1' }],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserPublic' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update a user (admin only)',
        description: 'Update email, role, or active status. At least one field required. Admin cannot deactivate their own account.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  email: { type: 'string', format: 'email', example: 'updated@example.com' },
                  role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
                  isActive: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserPublic' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user (admin only)',
        description: 'Permanently removes a user. Admin cannot delete their own account.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'User deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string' } } } } } },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Transactions
    '/api/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions (all roles)',
        description: 'Returns paginated, filterable transactions. Soft-deleted records are excluded.',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] }, description: 'Filter by transaction type' },
          { in: 'query', name: 'category', schema: { type: 'string' }, description: 'Partial, case-insensitive category filter' },
          { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date' }, example: '2024-01-01', description: 'Start date (inclusive)' },
          { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date' }, example: '2024-12-31', description: 'End date (inclusive)' },
        ],
        responses: {
          '200': {
            description: 'Paginated transaction list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      allOf: [
                        { $ref: '#/components/schemas/PaginationMeta' },
                        {
                          type: 'object',
                          properties: {
                            transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Create a transaction (analyst, admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'type', 'category', 'date'],
                properties: {
                  amount: { type: 'number', minimum: 0.01, multipleOf: 0.01, example: 2500.0 },
                  type: { type: 'string', enum: ['income', 'expense'], example: 'income' },
                  category: { type: 'string', minLength: 1, maxLength: 100, example: 'Salary' },
                  date: { type: 'string', format: 'date', example: '2024-01-15' },
                  notes: { type: 'string', maxLength: 500, nullable: true, example: 'Monthly salary' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Transaction created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Transaction' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/transactions/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Get transaction by ID (all roles)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Transaction details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Transaction' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Transactions'],
        summary: 'Update a transaction (analyst, admin)',
        description: 'Partial update. At least one field required.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  amount: { type: 'number', minimum: 0.01, multipleOf: 0.01, example: 3000.0 },
                  type: { type: 'string', enum: ['income', 'expense'] },
                  category: { type: 'string', minLength: 1, maxLength: 100 },
                  date: { type: 'string', format: 'date' },
                  notes: { type: 'string', maxLength: 500, nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated transaction',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Transaction' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Soft-delete a transaction (admin only)',
        description: 'Sets `isDeleted: true`. The record is preserved for audit but no longer returned in list/get endpoints.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Transaction soft-deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string' } } } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Dashboard
    '/api/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Financial summary (all roles)',
        description: 'Returns aggregated totals, category breakdowns, recent transactions, and monthly trends. All parallel MongoDB aggregations.',
        responses: {
          '200': {
            description: 'Dashboard summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DashboardSummary' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
}
