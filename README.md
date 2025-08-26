# Onboard - Multi-Tenant Onboarding Platform

A modern, multi-tenant SaaS platform for creating customized onboarding flows with AI-powered assessments, content delivery, and progress tracking.

## 🚀 Features

### ✅ Completed Features

#### Phase 1: Foundation & Infrastructure
- **Next.js 14** with TypeScript, App Router, and Tailwind CSS
- **Supabase** authentication with email/password
- **Multi-tenant architecture** with Row Level Security (RLS)
- **Role-based access control** (Admin/Participant)

#### Phase 2: UI Foundation & Theming
- **Shadcn/ui** component library integration
- **8 pre-defined themes** with real-time switching
- **Responsive dashboard layouts** for different user roles
- **Clean, accessible design** following user preferences (no shadows, subtle colors)

#### Phase 3: Content Management System
- **File upload** with drag-and-drop support
- **Content viewers** for PDFs, videos, images, and documents
- **Content library** with search, filtering, and metadata management
- **Cloudflare R2** integration for file storage (configured but not fully implemented)

#### Phase 4: Flow Builder Core
- **Stage-based flow builder** with structured learning paths
- **Stage management** with Content, Assessment, and Info items
- **Form-based interface** for creating and editing learning stages
- **Real-time flow editing** with auto-save functionality

### 🚧 In Progress / Planned Features

#### Phase 4: Flow Builder (Remaining)
- Branching logic and conditional routing
- Flow persistence with version control

#### Phase 5: AI Assessment Engine
- OpenAI/Claude API integration
- Content analysis and embedding generation
- AI quiz generation with multiple question types
- Assessment taking interface with scoring

#### Phase 6: Progress Tracking & Analytics
- Real-time progress tracking with Supabase Realtime
- Admin analytics dashboard with Recharts
- Participant progress portal
- Email notifications with Resend

#### Phase 7: Polish & Production
- Error handling and loading states
- Caching with Upstash Redis
- Monitoring with Sentry and Vercel Analytics
- Testing with Vitest and Playwright
- Vercel deployment

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Cloudflare R2
- **State Management**: Zustand, TanStack Query
- **Flow Builder**: React Flow
- **AI**: OpenAI API (planned)
- **Email**: Resend (planned)
- **Deployment**: Vercel (planned)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd onboard
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Cloudflare R2 Configuration
   R2_ACCESS_KEY_ID=your_r2_access_key_here
   R2_SECRET_ACCESS_KEY=your_r2_secret_key_here
   R2_BUCKET_NAME=your_r2_bucket_name_here
   R2_ENDPOINT=your_r2_endpoint_here

   # Resend Email Configuration
   RESEND_API_KEY=your_resend_api_key_here

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   
   Create a new Supabase project and configure authentication:
   
   a. **Enable Email/Password Authentication**
      - Go to Authentication → Settings in your Supabase dashboard
      - Enable "Email" under Auth Providers
      - Disable "Enable email confirmations" (optional, for easier development)
      - Configure password requirements as needed
   
   b. **Run database migrations**:
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Initialize Supabase (if not already done)
   supabase init

   # Link to your project
   supabase link --project-ref your-project-ref

   # Run migrations
   supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Schema

The platform uses a multi-tenant architecture with the following key tables:

- **onboard_organizations**: Organization/tenant data
- **onboard_users**: User profiles with org association
- **onboard_flows**: Onboarding flow definitions
- **onboard_content**: File and content management
- **onboard_assessments**: Quiz and assessment data
- **onboard_participant_progress**: Progress tracking

All tables include Row Level Security (RLS) policies for data isolation.

## 🎨 Theming

The platform includes 8 pre-defined themes:
- Violet (default)
- Blue
- Green
- Orange
- Red
- Slate
- Rose
- Zinc

Themes can be switched in real-time from the dashboard header.

## 📱 User Roles

### Admin Users
- Create and manage onboarding flows
- Upload and organize content
- Generate AI assessments
- View analytics and participant progress
- Manage organization settings

### Participant Users
- Complete assigned onboarding flows
- View progress and achievements
- Access resources and materials
- Take assessments and quizzes

## 🔐 Authentication

The platform uses Supabase Auth with email/password authentication:
- Secure email/password login and registration
- Password reset functionality
- Automatic user profile creation
- Role-based access control
- Secure session management

## 📊 Flow Builder

The stage-based flow builder allows admins to:
- Create structured onboarding workflows
- Add different item types (Content, Assessment, Info) to stages
- Organize learning paths with sequential stages
- Preview flows before publishing
- Track participant progress through flows

## 🎯 Getting Started

1. **Sign up** at the homepage with your email and password
2. **Verify your email** if email confirmation is enabled
3. **Complete your profile** setup and organization creation
4. **Create your first flow** using the Flow Builder
5. **Add content** to your phases
6. **Invite participants** to start onboarding

## 🤝 Contributing

This is a comprehensive implementation of a multi-tenant onboarding platform. The codebase is well-structured with:

- Type-safe TypeScript throughout
- Modular component architecture
- Comprehensive error handling
- Responsive design patterns
- Accessibility considerations

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Note**: This platform is currently in active development. Some features may be incomplete or require additional configuration. Please refer to the TODO list in the codebase for current development status.