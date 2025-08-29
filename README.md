# Onboard - Community Onboarding Platform

<div align="center">

![Onboard Logo](https://img.shields.io/badge/Onboard-Community%20Platform-purple?style=for-the-badge)

**Transform how your community welcomes and trains new members with structured, AI-powered onboarding flows.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Features](#features) • [Quick Start](#quick-start) • [Tech Stack](#tech-stack) • [Contributing](#contributing)

</div>

---

## 🌟 What is Onboard?

Onboard is an open-source, multi-tenant platform designed specifically for **communities, organizations, and educational institutions** who want to create structured onboarding experiences for their members. Before granting full access to community resources, new members progress through customizable stages that may include:

- **Content Consumption** - Videos, documents, presentations
- **Assessments** - AI-generated or manual quizzes and evaluations
- **Information Sections** - Important announcements and guidelines
- **Progress Tracking** - Real-time monitoring of member advancement

Perfect for **startup communities**, **professional organizations**, **educational institutions**, **non-profits**, **developer communities**, and any group that needs systematic member onboarding.

## 🎯 Use Cases

### 🏢 Professional Communities
- **Developer Communities**: Onboard new developers with coding challenges, documentation review, and technical assessments
- **Startup Accelerators**: Guide founders through program materials, pitch training, and milestone evaluations
- **Professional Associations**: Ensure members understand guidelines, complete certifications, and access exclusive resources

### 🎓 Educational Institutions
- **Online Courses**: Structure learning paths with video content, reading materials, and automated assessments
- **Training Programs**: Create comprehensive orientation flows for new students or employees
- **Certification Bodies**: Manage prerequisite learning and competency assessments

### 🤝 Community Organizations
- **Non-Profit Organizations**: Onboard volunteers with training materials and knowledge verification
- **Membership Organizations**: Welcome new members with introductory content and community guidelines
- **Gaming Communities**: Create progression systems for new players with tutorials and skill assessments

## ✨ Key Features

### 🔨 Stage-Based Flow Builder
Create structured onboarding journeys using an intuitive stage-based interface:
- **Sequential Progression**: Members advance through stages in order
- **Mixed Content Types**: Combine videos, documents, assessments, and information sections
- **Flexible Structure**: Design simple linear flows or complex branching experiences
- **Visual Builder**: Easy drag-and-drop interface for creating flows

### 🤖 AI-Powered Assessments
Generate engaging evaluations automatically:
- **Content-Based Generation**: Upload documents/videos and generate relevant quizzes
- **Multiple Question Types**: Multiple choice, true/false, short answer, essay questions
- **Customizable Scoring**: Set passing thresholds and retry limits
- **Smart Feedback**: AI-generated explanations for correct and incorrect answers

### 📁 Comprehensive Content Management
Handle diverse content types efficiently:
- **File Storage**: Secure upload and management with Cloudflare R2
- **Multiple Formats**: Support for PDFs, videos (MP4/MOV), documents, images
- **External Links**: Integrate YouTube, Vimeo, Google Drive, and other external resources
- **Version Control**: Track and manage content updates over time

### 📊 Real-Time Progress Tracking
Monitor member advancement with detailed analytics:
- **Individual Progress**: Track each member's journey through stages
- **Completion Analytics**: View completion rates, average times, and bottlenecks
- **Performance Insights**: Identify which stages need improvement
- **Export Capabilities**: Generate reports for stakeholders

### 🎨 Customizable Themes
Make the platform match your community's identity:
- **8 Pre-built Themes**: Violet, Blue, Green, Orange, Red, Slate, Rose, Zinc
- **Environment-Based**: Set theme via `NEXT_PUBLIC_APP_THEME` environment variable
- **Dark/Light Modes**: Support for user preferences
- **Consistent Experience**: Themed interface throughout the platform

### 👥 Multi-Tenant Architecture
Perfect for SaaS deployment or self-hosting:
- **Complete Data Isolation**: Each organization's data is fully separated
- **Role-Based Access**: Admin and participant roles with appropriate permissions
- **Scalable Design**: Handle multiple organizations on single deployment

## 🛠 Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Shadcn/ui](https://ui.shadcn.com/)** - Modern React components
- **[React Hook Form](https://react-hook-form.com/)** - Form handling with validation
- **[Framer Motion](https://www.framer.com/motion/)** - Animations and interactions

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database with real-time features
- **[Supabase Auth](https://supabase.com/auth)** - Authentication and user management
- **[Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)** - Data isolation for multi-tenancy
- **Next.js API Routes** - Server-side API endpoints

### Storage & External Services
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** - Object storage for files
- **[OpenAI API](https://openai.com/api/)** - AI-powered assessment generation
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching

### Development & Deployment
- **[Vercel](https://vercel.com/)** - Hosting and deployment
- **[ESLint](https://eslint.org/)** - Code linting and formatting
- **[Zod](https://zod.dev/)** - Runtime type validation
- **[Zustand](https://github.com/pmndrs/zustand)** - State management

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or later
- **npm** or **yarn** package manager  
- **Supabase Account** ([free tier available](https://supabase.com/pricing))
- **Cloudflare Account** (for R2 storage - [free tier available](https://developers.cloudflare.com/r2/pricing/))

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/onboard.git
cd onboard
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudflare R2 Configuration (Required)
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Theme Configuration (Optional - defaults to violet)
# Options: violet, blue, green, orange, red, slate, rose, zinc
NEXT_PUBLIC_APP_THEME=violet

# AI Configuration (Optional - for assessment generation)
OPENAI_API_KEY=your_openai_api_key
```

### 3. Database Setup

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-reference

# Push the database schema
supabase db push
```

#### Option B: Manual Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to the SQL Editor
4. Run the migration files in order from `/supabase/migrations/`

### 4. Configure Supabase Authentication

In your Supabase Dashboard:

1. **Navigate to Authentication → Settings**
2. **Enable Email/Password Authentication**
3. **Set Site URL**: `http://localhost:3000`
4. **Add Additional Redirect URLs**: `http://localhost:3000/auth/callback`
5. **Disable email confirmation** (for development) or configure your email settings

### 5. Set Up Cloudflare R2 Storage

1. **Create an R2 Bucket**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to R2 Object Storage
   - Create a new bucket (note the bucket name)

2. **Generate API Tokens**:
   - Go to "My Profile" → "API Tokens"
   - Create token with R2:Edit permissions
   - Note the Access Key ID and Secret Access Key

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create Your First Admin Account

1. Navigate to `/login` and click "Sign Up"
2. Create an account with your email and password
3. Complete the onboarding flow and select "Administrator" role
4. You're ready to create your first onboarding flow!

## 📚 Usage Guide

### For Administrators

#### Creating Your First Onboarding Flow

1. **Access the Dashboard**: After logging in as an admin, you'll see the main dashboard
2. **Create New Flow**: Click "Create Flow" to start the flow builder
3. **Design Stages**: Add stages with different content types:
   - **Content Stages**: Upload videos, PDFs, or link external resources
   - **Assessment Stages**: Create quizzes manually or generate them with AI
   - **Information Stages**: Add important announcements or instructions
4. **Configure Settings**: Set completion requirements and member progression rules
5. **Publish Flow**: Make the flow available to participants

### For Participants/Members

#### Completing Onboarding

1. **Receive Invitation**: Get welcome email with login instructions
2. **Start Journey**: Begin with the first stage of your assigned flow
3. **Progress Through Stages**: Complete content, pass assessments, and advance
4. **Track Progress**: Monitor your advancement through the participant dashboard
5. **Achieve Membership**: Complete all requirements to gain full community access

## 🗄️ Database Schema

The platform uses a multi-tenant PostgreSQL database with Row Level Security:

### Core Tables

- **`onboard_organizations`**: Organization/community data and settings
- **`onboard_users`**: User profiles with organization association and roles  
- **`onboard_flows`**: Onboarding flow definitions and metadata
- **`onboard_stages`**: Individual stages within flows
- **`onboard_stage_items`**: Content items within stages (content, assessments, info)
- **`onboard_content`**: File and content metadata with storage URLs
- **`onboard_assessments`**: Quiz questions and configuration
- **`onboard_participant_progress`**: Real-time progress tracking

### Security Features

- **Row Level Security (RLS)**: Ensures complete data isolation between organizations
- **Role-Based Access Control**: Separate permissions for admins and participants
- **Secure File Access**: Presigned URLs for time-limited file access
- **Audit Logging**: Track all significant actions for security and compliance

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Fork this repository** to your GitHub account

2. **Create a new Vercel project**:
   - Connect your GitHub repository
   - Vercel will automatically detect it's a Next.js project

3. **Set Environment Variables**:
   - Add all the environment variables from your `.env.local`
   - Use Vercel's Environment Variables section in project settings

4. **Deploy**:
   - Vercel will automatically deploy on every push to main branch
   - Set up preview deployments for feature branches

### Production Considerations

- **Database**: Use Supabase Pro or host your own PostgreSQL instance
- **File Storage**: Configure Cloudflare R2 with appropriate CORS settings
- **Monitoring**: Consider adding Sentry for error tracking
- **Backups**: Implement regular database and file backups
- **SSL**: Ensure HTTPS is properly configured for all domains

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Contribution Guidelines

- **Code Style**: Follow the existing TypeScript and ESLint configuration
- **Testing**: Ensure your changes work locally before submitting
- **Documentation**: Update documentation for any new features
- **Commit Messages**: Use clear, descriptive commit messages
- **Pull Requests**: Provide detailed description of changes

### Areas for Contribution

- **UI/UX Improvements**: Enhance the user interface and experience
- **New Content Types**: Add support for additional file formats
- **Performance Optimization**: Improve loading times and responsiveness
- **Bug Fixes**: Identify and fix issues
- **Documentation**: Help improve guides and documentation
- **Translations**: Add support for multiple languages

## 🐛 Issue Reporting

If you encounter any issues:

1. **Search existing issues** to avoid duplicates
2. **Provide detailed information**: include error messages, browser info, and steps to reproduce
3. **Use descriptive titles**: clearly explain the problem

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ **Commercial Use**: Use for commercial projects
- ✅ **Modification**: Modify the source code
- ✅ **Distribution**: Distribute copies of the software
- ✅ **Private Use**: Use for private projects
- ❗ **Attribution**: Include original copyright notice

## 🙏 Acknowledgments

- **[Supabase](https://supabase.com/)** - For the amazing backend-as-a-service platform
- **[Vercel](https://vercel.com/)** - For seamless deployment and hosting
- **[Shadcn/ui](https://ui.shadcn.com/)** - For beautiful, accessible UI components
- **[Cloudflare](https://www.cloudflare.com/)** - For reliable file storage with R2
- **[OpenAI](https://openai.com/)** - For powering AI-driven assessment generation

## 🗺️ Roadmap

### Current Features ✅
- Stage-based flow builder
- Multi-tenant architecture
- AI assessment generation
- Progress tracking
- File management with R2
- 8 customizable themes

### Planned Features 🔄
- Advanced analytics dashboard
- Bulk user management
- Custom domain support
- Advanced branching logic
- Integration marketplace
- White-label options

---

<div align="center">

**Built with ❤️ for communities worldwide**

If you find this project helpful, please consider giving it a ⭐ on GitHub!

</div>