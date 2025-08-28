import { 
  LayoutDashboard, 
  Users, 
  Workflow,
  Upload,
  Brain,
  Award
} from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  shortName: string // for mobile bottom nav
  roles: ('admin' | 'participant')[] // who can see this item
  requiresCompletion?: boolean
  requiresMembership?: boolean
}

export const navigationItems: NavItem[] = [
  // Admin navigation items
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    shortName: 'Home',
    roles: ['admin'],
  },
  {
    name: 'Flow Builder',
    href: '/dashboard/flows',
    icon: Workflow,
    shortName: 'Flows',
    roles: ['admin'],
  },
  {
    name: 'Content Library',
    href: '/dashboard/content',
    icon: Upload,
    shortName: 'Content',
    roles: ['admin'],
  },
  {
    name: 'Assessments',
    href: '/dashboard/assessments',
    icon: Brain,
    shortName: 'Tests',
    roles: ['admin'],
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
    shortName: 'Users',
    roles: ['admin'],
  },
  
  // Participant navigation items
  {
    name: 'My Progress',
    href: '/dashboard',
    icon: LayoutDashboard,
    shortName: 'Home',
    roles: ['participant'],
  },
  {
    name: 'Content Library',
    href: '/dashboard/content',
    icon: Upload,
    shortName: 'Content',
    roles: ['participant'],
    requiresMembership: true,
  },
  {
    name: 'Certificates',
    href: '/dashboard/certificate',
    icon: Award,
    shortName: 'Certs',
    roles: ['participant'],
    requiresCompletion: true,
  },
]

// Helper function to get navigation items for a specific role
export function getNavigationItemsForRole(
  userRole: 'admin' | 'participant'
): NavItem[] {
  return navigationItems.filter(item => item.roles.includes(userRole))
}

// Helper function to get filtered navigation items based on permissions
export function getFilteredNavigationItems(
  userRole: 'admin' | 'participant',
  isMember: boolean = false,
  hasCompletedFlows: boolean = false
): NavItem[] {
  const roleItems = getNavigationItemsForRole(userRole)
  
  return roleItems.filter(item => {
    // Check membership requirement
    if (item.requiresMembership && !isMember) {
      return false
    }
    
    // Check completion requirement
    if (item.requiresCompletion && !hasCompletedFlows) {
      return false
    }
    
    return true
  })
}
