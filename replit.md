# Choice Properties - Full Stack Real Estate Application

## Project Overview
A full-stack real estate platform built with React, Express, and Supabase. The application allows users to browse properties, submit applications, manage inquiries, and connect with real estate agents.

## Tech Stack
- **Frontend:** React 19, Vite, TailwindCSS, Shadcn UI
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth (JWT-based)
- **State Management:** React Query, Context API
- **Routing:** Wouter

## Project Structure

```
project/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # Shadcn UI components
│   │   │   └── ...       # Feature components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and services
│   │   ├── data/         # Mock data
│   │   ├── index.css     # Global styles
│   │   └── main.tsx      # Entry point
│   └── index.html
├── server/                 # Backend Express application
│   ├── db/               # Database setup SQL files
│   ├── app.ts            # Express app configuration
│   ├── routes.ts         # API route handlers
│   ├── auth-middleware.ts # Authentication middleware
│   ├── storage.ts        # Database service layer
│   ├── index-dev.ts      # Development entry point
│   └── index-prod.ts     # Production entry point
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema definitions
├── migrations/            # Database migrations
├── scripts/              # Utility scripts (seeding, etc.)
├── public/               # PWA manifest and meta files
└── package.json          # Project dependencies

```

## Key Features

### Authentication
- User signup/login with email and password
- JWT-based token authentication
- Role-based access control (user, agent, admin)
- Automatic user record creation on signup via Supabase trigger

### Properties
- Browse active property listings
- Filter by location, price, bedrooms, property type
- View detailed property information with images
- Save favorite properties
- Submit rental applications

### Inquiries & Reviews
- Submit inquiries about properties
- View and manage property reviews (1-5 stars)
- Submit reviews for properties you've viewed

### User Management
- User profiles with customizable information
- Agent profiles visible to public
- Admin panel for managing all content
- Saved searches for properties

### Security
- Row Level Security (RLS) policies on all tables
- Rate limiting on auth and sensitive endpoints
- Encrypted database connections
- Secure session management

## Environment Variables

Required environment variables (see `.env.example`):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key for frontend
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for server operations
- `NODE_ENV` - development or production

Optional:
- `SENDGRID_API_KEY` - For email notifications
- `RATE_LIMITING_ENABLED` - Enable rate limiting

## Database Schema

### Tables
1. **users** - User accounts with roles (user, agent, admin)
2. **properties** - Property listings with details and amenities
3. **applications** - Rental applications with multi-step process
4. **inquiries** - Contact inquiries about properties
5. **reviews** - User reviews for properties
6. **favorites** - Saved properties per user
7. **requirements** - User property search criteria
8. **saved_searches** - Saved property searches
9. **newsletter_subscribers** - Email newsletter subscriptions
10. **contact_messages** - General contact form submissions

### Security
- All tables have Row Level Security (RLS) enabled
- 22+ RLS policies for fine-grained access control
- Automatic user sync trigger from auth.users to public.users
- Storage buckets for property images, profile images, and documents

## Running the Application

### Development
```bash
npm run dev
```
- Starts Express backend on port 5000
- Starts Vite frontend on port 5000 (same server)
- Hot reload enabled for both frontend and backend

### Production Build
```bash
npm run build
npm run start
```

### Type Checking
```bash
npm run check
```

### Database Operations
```bash
npm run db:push     # Push schema changes to database
npm run seed        # Run database seeding script
```

## API Documentation

See `API_DOCUMENTATION.md` for complete API reference including:
- Authentication endpoints
- Property CRUD operations
- Inquiry submissions
- Review management
- Favorites management

## Development Guidelines

### Frontend
- Use `wouter` for routing
- Use React Query (`@tanstack/react-query`) for data fetching
- Use Shadcn UI components for consistent styling
- Use React Hook Form for form management
- Add `data-testid` to interactive elements

### Backend
- Keep routes thin - use storage service layer
- Validate all inputs with Zod schemas
- Use `authenticateToken` middleware for protected routes
- Use `requireRole` middleware for role-based access
- Cache user roles for performance

### Database
- Use Drizzle ORM for type-safe queries
- Define schemas in `shared/schema.ts`
- Create insert schemas with Zod validation
- Use migrations for structural changes

## Deployment

The project is configured for Replit deployment:
- **Build:** `npm run build` (compiles TypeScript, bundles frontend)
- **Run:** `npm run start` (starts Express production server)
- **Type:** Autoscale (stateless web application)

## User Roles

### User (Default)
- Browse properties
- Submit rental applications
- View and submit reviews
- Save favorite properties
- Track saved searches

### Agent
- Manage property listings
- View inquiries about properties
- View property requirements from other users
- Manage application status

### Admin
- Access admin panel
- Manage all users and properties
- View all applications and inquiries
- Manage platform settings
- View all reviews and content

## Recent Changes (December 10, 2025)

### Setup & Configuration
✅ Supabase authentication configured
✅ Database schema created with 7 tables
✅ Row Level Security policies implemented
✅ User sync trigger configured
✅ Storage buckets created (property-images, profile-images, documents)
✅ `.env.example` file added
✅ API documentation created

### Project Organization
✅ Removed unnecessary files (AUTO_GUIDE, netlify.toml, etc.)
✅ Cleaned up temporary assets
✅ Organized project structure

## Useful Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:5000)
npm run dev

# Type checking
npm run check

# Production build
npm run build

# Start production server
npm run start

# Push database schema changes
npm run db:push

# Seed database with sample data
npm run seed
```

## Notes

- The application uses Supabase for all backend services
- Authentication is handled entirely by Supabase
- Database queries are cached for performance optimization
- Rate limiting is enabled in production to prevent abuse
- All sensitive data is encrypted and requires authentication
- Email notifications use SendGrid (optional)

## Next Steps

1. Test the signup/login functionality
2. Create sample property listings
3. Test property browsing and filtering
4. Set up email notifications (optional)
5. Deploy to production when ready
