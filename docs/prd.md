# Product Requirements Document (PRD)
## Multi-Tenant Onboarding Platform

### Executive Summary

A cloud-based SaaS platform that enables organizations to design, deploy, and track customized onboarding experiences for their members or staff. The platform supports multi-path onboarding flows with content delivery (videos/documents), AI-powered assessments with passing scores, and comprehensive progress tracking.

---

## 1. Product Overview

### 1.1 Vision Statement
Create a flexible, intuitive onboarding platform that transforms how organizations welcome and train new members, reducing time-to-productivity while ensuring comprehensive knowledge transfer and engagement.

### 1.2 Key Value Propositions
- **For Organizations:** Streamline onboarding, ensure compliance, reduce training time by up to 70%
- **For Participants:** Clear learning paths, self-paced progress, engaging content delivery
- **For Admins:** Real-time analytics, completion tracking, automated workflow management, customizable branding

### 1.3 Target Market
- Small to medium enterprises (10-5000 employees)
- Educational institutions
- Professional associations
- Non-profit organizations
- Healthcare facilities
- Tech startups to established corporations

---

## 2. User Personas & Roles

### 2.1 Admin (Organization Owner/HR Manager)
**Responsibilities:**
- Design onboarding flows
- Upload/link content
- Create assessments (with AI assistance)
- Track participant progress
- Generate reports
- Manage organization settings
- Select platform theme

**Pain Points:**
- Manual tracking of onboarding progress
- Inconsistent onboarding experiences
- Difficulty measuring effectiveness
- Time-consuming content distribution
- Creating engaging assessments

### 2.2 Participant (New Employee/Member)
**Responsibilities:**
- Complete assigned onboarding phases
- Watch videos/read documents
- Pass assessments
- Track own progress

**Pain Points:**
- Information overload
- Unclear expectations
- Lack of structured learning path
- No visibility into progress

---

## 3. Core Features (MVP)

### 3.1 Flow Builder
**Visual Drag-and-Drop Interface**
- Canvas-based flow designer using React Flow
- Phase creation with branching logic
- Conditional path routing based on:
  - Quiz scores
  - Role/department selection
  - Previous phase completion
  - Time-based triggers

**Phase Components:**
- Content blocks (video/document)
- Assessment blocks (AI-generated quiz/questionnaire)
- Information blocks (text/instructions)
- Decision points (branching nodes)

### 3.2 Content Management

**Supported Content Types:**
- **Documents:** PDF, DOCX, PPT (stored in Cloudflare R2)
- **Videos:** 
  - Direct upload: MP4, MOV (Cloudflare R2)
  - External links: YouTube, Vimeo, Wistia
- **SCORM packages:** For existing e-learning content
- **Web links:** External resources

**Content Features:**
- Version control for uploaded documents
- Cloudflare R2 for global CDN distribution
- Progress tracking (% viewed/read)
- Automatic optimization for different devices

### 3.3 AI-Powered Assessment Engine

**AI Quiz Generation:**
- Automatic question generation from uploaded content
- Multiple question types based on content analysis
- Difficulty level adjustment
- Context-aware question creation
- Review and edit AI suggestions

**Question Types:**
- Multiple choice (single/multi-select)
- True/False
- Short answer (keyword matching)
- Essay (manual review or AI-assisted)
- File upload (for assignments)

**Assessment Configuration:**
- Passing score threshold (percentage)
- Retry attempts limit
- Time limits (optional)
- Question randomization
- Answer shuffling
- Feedback messages (correct/incorrect)
- AI-generated explanations for answers

### 3.4 Progress Tracking

**Admin Dashboard:**
- Organization-wide completion rates
- Average time per phase
- Assessment score analytics
- Bottleneck identification (high drop-off phases)
- Individual participant timelines
- Cohort comparisons
- Export capabilities

**Participant View:**
- Visual progress bar
- Completed/remaining phases
- Score history
- Time spent per phase
- Next steps clearly indicated
- Achievement badges

### 3.5 Notifications System (Resend)

**Automated Triggers:**
- Welcome email on enrollment
- Phase completion confirmations
- Assessment result notifications
- Reminder emails for inactive participants
- Certificate of completion
- Deadline reminders

**Customizable Templates:**
- Email branding (logo, colors)
- Message personalization (name, role)
- Multi-language support
- Custom sender domains

### 3.6 Theming & Customization

**Pre-defined Theme Options:**
- **Modern Blue:** Professional corporate theme
- **Warm Orange:** Friendly and welcoming
- **Forest Green:** Nature and growth focused
- **Purple Gradient:** Creative and innovative
- **Monochrome:** Minimalist black and white
- **Ocean Teal:** Calm and trustworthy
- **Sunset Red:** Bold and energetic
- **Neutral Gray:** Classic and timeless

**Theme Configuration:**
- Select from 8 pre-defined themes
- Each theme includes:
  - Primary, secondary, accent colors
  - Background and text colors
  - Button and border styles
  - Matching email templates
- Logo upload and placement
- Light/dark mode toggle
- Accessibility compliant (WCAG 2.1)

---

## 4. Technical Architecture

### 4.1 Multi-Tenant Architecture

**Deployment Strategy:**
1. **SaaS Multi-Tenant** (Primary)
   - Supabase Row Level Security (RLS)
   - Organization ID isolation
   - Shared infrastructure
   - Automatic scaling
   
2. **Self-Hosted** (Enterprise Option)
   - Docker containerization
   - Supabase self-hosted
   - Separate R2 bucket
   - Full data control

### 4.2 Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Shadcn/ui components
- Tailwind CSS
- React Flow (flow builder)
- Recharts (analytics)
- React Query/SWR (data fetching)
- Framer Motion (animations)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth + Realtime)
- Edge Functions (Supabase/Vercel)
- Cloudflare R2 (file storage)
- Redis (via Upstash for caching)

**AI Integration:**
- OpenAI API / Anthropic Claude API
- Langchain for prompt management
- Vector database (Supabase pgvector)
- Content embeddings for quiz generation

**Infrastructure:**
- Vercel (hosting)
- Cloudflare R2 (storage + CDN)
- Resend (email service)
- Stripe (payments)
- Sentry (error monitoring)

### 4.3 Security & Compliance

**Data Protection:**
- Supabase RLS policies
- End-to-end encryption (TLS 1.3)
- Encryption at rest (Supabase/R2)
- GDPR compliance tools
- Audit logs

**Authentication (Supabase Auth):**
- JWT-based sessions
- Email/password authentication
- SSO support (SAML 2.0, OAuth 2.0)
- Password reset functionality
- Multi-factor authentication (optional)
- Role-based access control (RBAC)

### 4.4 Performance Requirements

- Page load time: < 2 seconds
- API response time: < 200ms (p95)
- Video start time: < 3 seconds
- 99.9% uptime SLA
- Support for 10,000 concurrent users
- Edge deployment for global performance

---

## 5. User Workflows

### 5.1 Admin: Creating an Onboarding Flow

1. **Access Flow Builder**
   - Navigate to "Flows" dashboard
   - Click "Create New Flow"
   - Choose template or start from scratch

2. **Design Flow Structure**
   - Drag phases from component panel
   - Connect phases with visual paths
   - Set branching conditions
   - Configure phase prerequisites

3. **Add Content to Phases**
   - Upload to Cloudflare R2 or link external
   - Use AI to generate quiz from content
   - Review and customize AI-generated questions
   - Set passing requirements

4. **Apply Branding**
   - Select from pre-defined themes
   - Upload organization logo
   - Preview on different devices

5. **Configure Settings**
   - Set enrollment rules
   - Define completion criteria
   - Configure Resend email templates
   - Set deadlines (optional)

6. **Publish Flow**
   - Preview complete flow
   - Test with preview mode
   - Publish to organization
   - Invite participants via email

### 5.2 Participant: Completing Onboarding

1. **Receive Invitation**
   - Resend email with login instructions
   - Supabase Auth email/password signup
   - Account verification (if email confirmation enabled)
   - Personalized welcome screen

2. **Start Onboarding**
   - View themed interface
   - See flow overview
   - Estimated completion time
   - Begin first phase

3. **Complete Phases**
   - Stream content from R2
   - Take AI-generated assessments
   - Receive immediate feedback
   - Progress saves automatically
   - Unlock next phases based on performance

4. **Track Progress**
   - Real-time progress updates
   - Review completed content
   - Retake assessments if needed
   - Download completion certificate

---

## 6. Data Model (Supabase Schema)

```sql
-- Core Tables with RLS (prefixed with onboard_)
CREATE TABLE onboard_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  theme_name TEXT DEFAULT 'modern-blue',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboard_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id UUID REFERENCES onboard_organizations(id),
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'participant')),
  profile JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboard_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES onboard_organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  flow_data JSONB NOT NULL, -- React Flow data
  is_published BOOLEAN DEFAULT FALSE,
  theme_override TEXT, -- Override org theme if needed
  created_by UUID REFERENCES onboard_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboard_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES onboard_flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('content', 'assessment', 'info')),
  content_url TEXT, -- R2 URL
  ai_quiz_config JSONB,
  settings JSONB DEFAULT '{}',
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboard_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES onboard_users(id),
  flow_id UUID REFERENCES onboard_flows(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  current_phase_id UUID REFERENCES onboard_phases(id)
);

CREATE TABLE onboard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES onboard_enrollments(id),
  phase_id UUID REFERENCES onboard_phases(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  attempts INTEGER DEFAULT 0,
  time_spent INTEGER, -- seconds
  data JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE onboard_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboard_progress ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy
CREATE POLICY "Users can view their org data" ON onboard_flows
  FOR SELECT USING (org_id = auth.jwt() ->> 'org_id');
```

---

## Implementation Plan

### Phase 1: Foundation
**Goal:** Basic infrastructure and authentication

**Tasks:**
1. **Project Setup**
   - Initialize Next.js 14 with TypeScript
   - Configure Supabase project
   - Set up Cloudflare R2 buckets
   - Install and configure Shadcn/ui
   - Set up Resend account

2. **Authentication System**
   - Implement Supabase Auth
   - Create login/signup pages
   - Email/password authentication
   - Password reset functionality
   - Protected routes with middleware
   - Role-based access (admin/participant)

3. **Organization Management**
   - Organization creation flow
   - Subdomain routing
   - Basic organization settings
   - RLS policies setup

**Deliverables:**
- Working auth system
- Organization creation and management
- Basic dashboard layouts

### Phase 2: Content Management
**Goal:** File upload and storage system

**Tasks:**
1. **R2 Integration**
   - File upload component
   - Direct upload to R2
   - Signed URL generation
   - File type validation
   - Progress indicators

2. **Content Library**
   - Document viewer (PDF, DOCX)
   - Video player component
   - External link management
   - Content organization

3. **Database Schema**
   - Content metadata tables
   - Version tracking
   - Access permissions

**Deliverables:**
- Working file upload to R2
- Content viewing capabilities
- Content management dashboard

### Phase 3: Flow Builder
**Goal:** Visual flow creation interface

**Tasks:**
1. **React Flow Integration**
   - Canvas setup
   - Custom node components
   - Drag and drop interface
   - Connection validation
   - Auto-layout options

2. **Phase Configuration**
   - Phase creation modal
   - Content assignment
   - Settings configuration
   - Branching logic builder
   - Condition editor

3. **Flow Management**
   - Save/load flows
   - Version history
   - Preview mode
   - Publish workflow

**Deliverables:**
- Interactive flow builder
- Phase configuration system
- Flow preview functionality

### Phase 4: AI Quiz Generation
**Goal:** AI-powered assessment creation

**Tasks:**
1. **AI Integration**
   - OpenAI/Claude API setup
   - Prompt engineering for quiz generation
   - Content analysis pipeline
   - Question type detection

2. **Quiz Builder**
   - AI suggestion interface
   - Manual editing capabilities
   - Question bank management
   - Answer validation

3. **Assessment Engine**
   - Quiz presentation
   - Score calculation
   - Retry logic
   - Result storage

**Deliverables:**
- AI quiz generation from content
- Assessment taking interface
- Score tracking system

### Phase 5: Theming & Customization
**Goal:** Organization branding capabilities

**Tasks:**
1. **Theme System**
   - Pre-defined theme implementation
   - Theme switcher component
   - CSS variable generation
   - Real-time preview
   - Theme persistence

2. **Branding Options**
   - Logo upload and positioning
   - Theme selection interface
   - Layout variations
   - Email template theming

3. **Shadcn Integration**
   - Component theming
   - Dark mode support
   - Accessibility testing

**Deliverables:**
- Theme selection interface
- 8 pre-defined themes
- Branded participant experience
- Themed email templates

### Phase 6: Progress Tracking & Analytics
**Goal:** Comprehensive tracking and reporting

**Tasks:**
1. **Progress System**
   - Real-time progress updates
   - Completion tracking
   - Time tracking
   - Attempt logging

2. **Analytics Dashboard**
   - Completion rates
   - Average scores
   - Time metrics
   - Bottleneck analysis
   - Export functionality

3. **Participant Portal**
   - Progress visualization
   - Score history
   - Certificate generation
   - Content review access

**Deliverables:**
- Admin analytics dashboard
- Participant progress portal
- Reporting capabilities
- MVP ready for testing

---

## Development Guidelines

### Code Organization
```
/app
  /(auth)
    /login
    /signup
  /(dashboard)
    /admin
      /flows
      /analytics
      /settings
    /participant
      /onboarding
      /progress
  /api
    /ai
    /upload
    /flows
/components
  /ui (shadcn)
  /flow-builder
  /theme-picker
  /content-viewer
/lib
  /supabase
  /r2
  /resend
  /ai
/hooks
/types
/utils
/themes
  /presets
```

### Key Development Practices
1. **Type Safety:** Full TypeScript coverage
2. **Component Library:** Shadcn/ui for consistency
3. **Database:** Supabase RLS for all tables
4. **File Storage:** Presigned URLs for R2
5. **Styling:** Tailwind CSS with CSS variables
6. **State Management:** Zustand for complex state
7. **Forms:** React Hook Form + Zod
8. **Testing:** Vitest + Playwright
9. **Deployment:** Vercel with preview deployments
10. **Monitoring:** Sentry for errors, Vercel Analytics

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Resend
RESEND_API_KEY=

# AI
OPENAI_API_KEY=
# or
ANTHROPIC_API_KEY=

# Stripe (future)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Theme Presets Structure
```typescript
// themes/presets.ts
// Gotten from a color library like radix with 
export const themePresets = {
  'modern-blue': {
    primary: ...,
    secondary: ...,
    accent: ...,
    background: ...,
    foreground: ...,
    muted: ...,
  },
  'warm-orange': ...,
    primary: ...,
    secondary: ...,
    accent: ...,
    // ...
  },
  // ... other themes
};
```

---

*This PRD and implementation plan serve as the foundation for building the onboarding platform with the specified technology stack. The document should be updated as development progresses and new insights are gained.*