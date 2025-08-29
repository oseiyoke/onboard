import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-primary">Nigerian Dreamers</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your dreams into reality with structured learning journeys, 
            assessments and seamless progress tracking designed for Nigerian entrepreneurs and innovators.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login">
                Start Your Journey
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/onboard">
                Learn More
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  🚀
                </div>
                Structured Learning Paths
              </CardTitle>
              <CardDescription>
                Follow carefully designed journeys that guide you from where you are to where you want to be
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  🏆
                </div>
                Progress & Achievements
              </CardTitle>
              <CardDescription>
                Track your growth, earn certificates, and celebrate milestones as you advance through your journey
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  🤝
                </div>
                Community Support
              </CardTitle>
              <CardDescription>
                Connect with fellow Nigerian dreamers, share experiences, and grow together in a supportive community
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Built for Nigerian Dreamers</CardTitle>
              <CardDescription>
                Empowering the next generation of Nigerian entrepreneurs, innovators, and visionaries 
                with structured learning paths and community support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login">
                  Join Nigerian Dreamers
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}