# Lyzr HR Helpdesk - Multi-Organizational SaaS Platform

## Overview

Lyzr HR Helpdesk is a comprehensive AI-powered HR support platform that enables organizations to automate employee support, manage tickets efficiently, and provide instant HR assistance. The platform supports multi-organizational workflows with role-based access control and intelligent routing.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, React 19
- **UI Components**: shadcn/ui, Tailwind CSS v4
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Lyzr Studio Integration
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom design system

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/lyzr/           # Lyzr authentication endpoint
│   │   └── user/organizations/   # User organizations endpoint
│   ├── dashboard/               # Dashboard pages
│   │   ├── ai-assistant/
│   │   ├── knowledge-base/
│   │   ├── organization/
│   │   ├── settings/
│   │   └── tickets/
│   ├── organizations/           # Organization selection page
│   └── page.tsx                 # Landing page
├── components/                  # Reusable UI components
│   └── ui/                     # shadcn/ui components
├── lib/                        # Utilities and configurations
│   ├── models/                 # Mongoose models
│   ├── AuthProvider.tsx        # Authentication context
│   ├── auth-helpers.ts         # Authentication utilities
│   ├── config.ts              # App configuration
│   ├── database.ts            # MongoDB connection
│   ├── organization-helpers.ts # Organization utilities
│   └── utils.ts               # General utilities
└── hooks/                      # Custom React hooks
```

## Database Schema

### User Model
```typescript
interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  lyzrUserId?: string;           // ID from Lyzr Studio
  currentOrganization?: string;  // Current active organization
  createdAt: Date;
  updatedAt: Date;
}
```

### Organization Model
```typescript
interface IOrganization {
  _id: string;
  name: string;
  lyzrApiKey?: string;          // Encrypted API key for Lyzr integration
  avatar?: string;
  createdBy: string;            // User ID of creator
  systemInstruction?: string;   // AI assistant instructions
  createdAt: Date;
  updatedAt: Date;
}
```

### OrganizationUser Model (Role Mapping)
```typescript
interface IOrganizationUser {
  _id: string;
  organizationId: string;
  email: string;
  userId?: string;              // null until user accepts invitation
  role: 'employee' | 'resolver' | 'manager' | 'admin';
  createdBy: string;
  inviteToken?: string;         // For invitation flow
  invitedAt?: Date;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Ticket Model
```typescript
interface ITicket {
  _id: string;
  trackingNumber: number;       // Auto-incremented
  title: string;
  description: string;
  category?: string;
  department?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending_information' | 'resolved' | 'closed';
  assignedTo: string[];         // Array of user IDs
  createdBy: string;
  organizationId: string;
  tags?: string[];
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### TicketMessage Model
```typescript
interface ITicketMessage {
  _id: string;
  ticketId: string;
  role: 'user' | 'agent' | 'system' | 'resolver';
  content: string;
  userId: string;
  attachments?: string[];       // File URLs/paths
  isInternal?: boolean;         // Internal notes not visible to ticket creator
  createdAt: Date;
  updatedAt: Date;
}
```

### Department Model
```typescript
interface IDepartment {
  _id: string;
  name: string;
  organizationId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### KnowledgeBase Model
```typescript
interface IKnowledgeBase {
  _id: string;
  title: string;
  fileId?: string;              // Lyzr Studio file identifier
  fileName?: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'url';
  fileUrl?: string;
  fileSize?: number;            // In bytes
  organizationId: string;
  uploadedBy: string;
  isActive: boolean;
  tags?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## User Flows

### 1. Authentication Flow
1. User visits landing page
2. Clicks "Login with Lyzr Studio"
3. Lyzr authentication completes
4. System creates/updates user in MongoDB via `/api/auth/lyzr`
5. User is redirected to organizations page

### 2. Organization Selection Flow
1. User views all organizations they belong to
2. Organizations show user's role (employee, resolver, manager, admin)
3. User selects organization to enter dashboard
4. System updates user's `currentOrganization` field

### 3. Dashboard Access Control
Based on user role in the organization:
- **Employee**: Access to AI Assistant, Tickets (own tickets)
- **Resolver**: Access to AI Assistant, Tickets (assigned tickets)
- **Manager**: Access to AI Assistant, Tickets, Knowledge Base
- **Admin**: Full access to all sections including Organization management

### 4. Ticket Management Flow
1. Create ticket with title, description, category, priority
2. System auto-assigns tracking number
3. Smart routing assigns to appropriate department/resolver
4. Ticket moves through status workflow: open → in_progress → resolved → closed
5. Messages/replies are tracked in TicketMessage model

### 5. Organization Management Flow (Admin only)
1. Add users by email with specific roles
2. Create and manage departments
3. Configure system instructions for AI assistant
4. Manage knowledge base documents

### 6. Knowledge Base Management Flow (Manager/Admin)
1. Upload PDF/DOCX/TXT files
2. Files are processed by Lyzr Studio
3. System stores file metadata and Lyzr file ID
4. AI assistant uses knowledge base for context

## API Endpoints

### Authentication
- `POST /api/auth/lyzr` - Create/update user from Lyzr authentication

### User Management
- `GET /api/user/organizations?userId={id}` - Get user's organizations

### Organizations (Planned)
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/{id}` - Get organization details
- `PUT /api/organizations/{id}` - Update organization
- `POST /api/organizations/{id}/members` - Add member to organization
- `PUT /api/organizations/{id}/members/{userId}` - Update member role

### Tickets (Planned)
- `GET /api/tickets` - List tickets (filtered by organization and role)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/{id}` - Get ticket details
- `PUT /api/tickets/{id}` - Update ticket
- `POST /api/tickets/{id}/messages` - Add message to ticket

### Knowledge Base (Planned)
- `GET /api/knowledge-base` - List knowledge base items
- `POST /api/knowledge-base` - Upload new document
- `DELETE /api/knowledge-base/{id}` - Remove document

## Environment Variables

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/lyzr-hr-helpdesk

# Lyzr Configuration  
NEXT_PUBLIC_LYZR_PUBLIC_KEY=your_lyzr_public_key_here

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Design System

### Typography Scale
- **Page Title**: `text-3xl md:text-4xl font-bold`
- **Section Heading**: `text-xl md:text-2xl font-semibold`
- **Card Title**: `text-lg font-medium`
- **Body Text**: `text-base font-normal`
- **Muted Text**: `text-sm text-muted-foreground`

### Spacing Scale
- **Page Padding**: `p-4 md:p-6 lg:p-8`
- **Card Padding**: `p-6`
- **Element Spacing**: `gap-4` or `gap-6`
- **Section Spacing**: `py-8` or `py-12`

### Component Usage
- **Cards**: For grouping related information
- **Tables**: For structured data display
- **Forms**: Always wrapped in Cards with consistent spacing
- **Buttons**: Primary actions solid, secondary actions outline
- **Navigation**: App sidebar with collapsible sections

## Security Considerations

1. **Authentication**: Integrated with Lyzr Studio for secure authentication
2. **Authorization**: Role-based access control at organization level
3. **Data Isolation**: All data scoped to organization context
4. **API Security**: User authentication required for all API endpoints
5. **Database**: Proper indexing and query optimization
6. **Encryption**: Sensitive data like API keys encrypted at rest

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live ticket updates
2. **Advanced Analytics**: Reporting dashboard with metrics
3. **Email Integration**: Automatic email notifications
4. **Mobile App**: React Native companion app
5. **Third-party Integrations**: Slack, Microsoft Teams, etc.
6. **Advanced AI Features**: Sentiment analysis, auto-categorization
7. **Multi-language Support**: Internationalization

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env.local`)
4. Configure MongoDB connection
5. Set up Lyzr Studio integration
6. Run development server: `npm run dev`

## Development Guidelines

1. **Code Quality**: Use TypeScript strictly, no `any` types
2. **Component Structure**: Follow shadcn/ui patterns
3. **State Management**: Use React Context for global state
4. **Error Handling**: Comprehensive error boundaries and try-catch blocks
5. **Performance**: Optimize with React.memo, useMemo, useCallback where needed
6. **Testing**: Write unit tests for utilities and integration tests for API routes
7. **Documentation**: Keep this document updated with schema and API changes

## Deployment

The application is designed to be deployed on:
- **Frontend**: Vercel, Netlify, or similar platform
- **Database**: MongoDB Atlas for production
- **Environment**: Node.js 18+ runtime

Ensure all environment variables are properly configured in the deployment platform.
