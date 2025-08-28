'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Info, FileText, Brain } from 'lucide-react'
import { StageWithItems } from '@/lib/services/stage.service'
import { ItemRenderer } from './item-renderer'

interface ContentAreaProps {
  currentStage: StageWithItems
  activeItemIndex: number
  onItemIndexChange: (index: number) => void
  onCompleteItem: (itemId: string, score?: number) => void
  isItemCompleted: (itemId: string) => boolean
  enrollmentId: string
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'content': return FileText
    case 'assessment': return Brain
    case 'info': return Info
    default: return FileText
  }
}

export function ContentArea({
  currentStage,
  activeItemIndex,
  onItemIndexChange,
  onCompleteItem,
  isItemCompleted,
  enrollmentId
}: ContentAreaProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Stage Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{currentStage.title}</h2>
            {currentStage.description && (
              <p className="text-muted-foreground mt-1">{currentStage.description}</p>
            )}
          </div>
          {currentStage.image_url && (
            <img 
              src={currentStage.image_url} 
              alt={currentStage.title}
              className="w-16 h-16 object-cover rounded"
            />
          )}
        </div>
      </div>

      {/* Item Content */}
      <div className="flex-1 p-6">
        {currentStage.items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card>
              <CardContent className="text-center p-8">
                <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Content</h3>
                <p className="text-muted-foreground">
                  This stage doesn&apos;t have any content yet.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs 
            value={activeItemIndex.toString()} 
            onValueChange={(value) => onItemIndexChange(parseInt(value))}
          >
            <TabsList 
              className="grid w-full" 
              style={{ gridTemplateColumns: `repeat(${currentStage.items.length}, 1fr)` }}
            >
              {currentStage.items.map((item, index) => {
                const ItemIcon = getItemIcon(item.type)
                const completed = isItemCompleted(item.id)
                
                return (
                  <TabsTrigger key={item.id} value={index.toString()} className="gap-2">
                    <ItemIcon className="w-4 h-4" />
                    {item.title}
                    {completed && <CheckCircle className="w-3 h-3 text-green-600" />}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {currentStage.items.map((item, index) => (
              <TabsContent key={item.id} value={index.toString()} className="mt-6">
                <ItemRenderer 
                  item={item} 
                  onComplete={(score) => onCompleteItem(item.id, score)}
                  isCompleted={isItemCompleted(item.id)}
                  enrollmentId={enrollmentId}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  )
}
