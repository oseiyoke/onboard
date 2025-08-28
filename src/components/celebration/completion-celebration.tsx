'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Trophy, 
  Award, 
  Sparkles, 
  CheckCircle,
  Download,
  Share2
} from 'lucide-react'

interface CompletionCelebrationProps {
  flowName: string
  onViewCertificate: () => void
  onDismiss: () => void
  show: boolean
}

export function CompletionCelebration({ 
  flowName, 
  onViewCertificate, 
  onDismiss, 
  show 
}: CompletionCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }))
      setConfetti(particles)
    }
  }, [show])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onDismiss}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-3 h-3 animate-bounce"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: '3s'
            }}
          >
            <div 
              className="w-full h-full rounded-full bg-primary"
            />
          </div>
        ))}
      </div>

      {/* Celebration Modal */}
      <div
        className="relative z-10 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full max-w-md mx-2 sm:mx-4 overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground text-center relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Trophy className="w-10 h-10" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
              <p className="text-primary-foreground/80">
                You&apos;ve successfully completed
              </p>
              <p className="font-semibold text-lg mt-1">
                &quot;{flowName}&quot;
              </p>
            </div>

            <div className="absolute top-4 right-4">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
            </div>
          </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Flow Complete!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your certificate is now available for download
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={onViewCertificate}
                    className="w-full gap-2"
                  >
                    <Award className="w-4 h-4" />
                    View My Certificate
                  </Button>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        // TODO: Implement download
                        onDismiss()
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        // TODO: Implement share
                        onDismiss()
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    onClick={onDismiss}
                    className="w-full text-muted-foreground"
                  >
                    Continue Learning
                  </Button>
                </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
