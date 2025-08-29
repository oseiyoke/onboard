'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, GripVertical, ArrowRight } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface Question {
  id: string
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer' | 'essay' | 'file_upload'
  question: string
  options: string[]
  correctAnswer: any
  explanation: string
  points: number
  position: number
}

interface QuestionBuilderProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
  onNext: () => void
}

export function QuestionBuilder({ questions, onChange, onNext }: QuestionBuilderProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    questions.length > 0 ? questions[0].id : null
  )

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(questions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions
    const updatedQuestions = items.map((item, index) => ({
      ...item,
      position: index
    }))

    onChange(updatedQuestions)
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    const updatedQuestions = questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    )
    onChange(updatedQuestions)
  }

  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions
      .filter(q => q.id !== questionId)
      .map((q, index) => ({ ...q, position: index }))
    onChange(updatedQuestions)
    
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(updatedQuestions.length > 0 ? updatedQuestions[0].id : null)
    }
  }

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    
    updateQuestion(questionId, {
      options: [...question.options, '']
    })
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    
    const newOptions = [...question.options]
    newOptions[optionIndex] = value
    updateQuestion(questionId, { options: newOptions })
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId)
    if (!question || question.options.length <= 2) return
    
    const newOptions = question.options.filter((_, index) => index !== optionIndex)
    updateQuestion(questionId, { options: newOptions })
  }

  const getCorrectAnswerInput = (question: Question) => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <Select
            value={question.correctAnswer || ''}
            onValueChange={(value) => updateQuestion(question.id, { correctAnswer: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select correct answer" />
            </SelectTrigger>
            <SelectContent>
              {question.options.filter(option => option.trim() !== '').length === 0 ? (
                <SelectItem value="no_options" disabled>
                  Add options first
                </SelectItem>
              ) : (
                question.options
                  .filter(option => option.trim() !== '')
                  .map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        )

      case 'multi_select':
        return (
          <div className="space-y-2">
            <Label className="text-sm">Select all correct answers:</Label>
            {question.options.filter(option => option.trim() !== '').length === 0 ? (
              <div className="text-sm text-muted-foreground">Add options first</div>
            ) : (
              question.options
                .filter(option => option.trim() !== '')
                .map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Switch
                      checked={(question.correctAnswer || []).includes(option)}
                      onCheckedChange={(checked) => {
                        const current = question.correctAnswer || []
                        const updated = checked
                          ? [...current, option]
                          : current.filter((a: string) => a !== option)
                        updateQuestion(question.id, { correctAnswer: updated })
                      }}
                    />
                    <Label className="text-sm">{option}</Label>
                  </div>
                ))
            )}
          </div>
        )

      case 'true_false':
        return (
          <Select
            value={question.correctAnswer?.toString() || ''}
            onValueChange={(value) => updateQuestion(question.id, { correctAnswer: value === 'true' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select correct answer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )

      case 'short_answer':
        return (
          <Input
            placeholder="Correct answer"
            value={question.correctAnswer || ''}
            onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
          />
        )

      case 'essay':
        return (
          <div className="text-sm text-muted-foreground">
            Essay questions require manual grading
          </div>
        )

      default:
        return null
    }
  }

  const isValid = questions.length > 0 && questions.every(q => 
    q.question.trim() && (
      q.type === 'essay' || q.correctAnswer !== undefined && q.correctAnswer !== ''
    )
  )

  return (
    <div className="space-y-6">
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                📝
              </div>
              <div>
                <h3 className="font-semibold">No questions yet</h3>
                <p className="text-muted-foreground text-sm">
                  Add your first question to get started
                </p>
              </div>
              <Button
                onClick={() => {
                  const newQuestion: Question = {
                    id: Date.now().toString(),
                    type: 'multiple_choice',
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                    explanation: '',
                    points: 1,
                    position: 0
                  }
                  onChange([newQuestion])
                  setExpandedQuestionId(newQuestion.id)
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Question
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {questions.map((question, index) => (
                  <Draggable key={question.id} draggableId={question.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="space-y-4"
                      >
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-muted-foreground hover:text-foreground cursor-grab"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <CardTitle className="text-base">
                                  Question {index + 1}
                                </CardTitle>
                                <Select
                                  value={question.type}
                                  onValueChange={(value: any) => updateQuestion(question.id, { type: value })}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="multi_select">Multi Select</SelectItem>
                                    <SelectItem value="true_false">True/False</SelectItem>
                                    <SelectItem value="short_answer">Short Answer</SelectItem>
                                    <SelectItem value="essay">Essay</SelectItem>
                                    <SelectItem value="file_upload">File Upload</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedQuestionId(
                                    expandedQuestionId === question.id ? null : question.id
                                  )}
                                >
                                  {expandedQuestionId === question.id ? 'Collapse' : 'Edit'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteQuestion(question.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          {expandedQuestionId === question.id && (
                            <CardContent>
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <Label>Question *</Label>
                                  <Textarea
                                    placeholder="Enter your question..."
                                    value={question.question}
                                    onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                                    rows={2}
                                  />
                                </div>

                                {(question.type === 'multiple_choice' || question.type === 'multi_select') && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label>Answer Options</Label>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addOption(question.id)}
                                        className="gap-2"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Add Option
                                      </Button>
                                    </div>
                                    {question.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex gap-2">
                                        <Input
                                          placeholder={`Option ${optionIndex + 1}`}
                                          value={option}
                                          onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                        />
                                        {question.options.length > 2 && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeOption(question.id, optionIndex)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label>Correct Answer *</Label>
                                  {getCorrectAnswerInput(question)}
                                </div>

                                <div className="space-y-2">
                                  <Label>Explanation (optional)</Label>
                                  <Textarea
                                    placeholder="Explain why this is the correct answer..."
                                    value={question.explanation}
                                    onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                                    rows={2}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Points</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={question.points}
                                    onChange={(e) => updateQuestion(question.id, { points: parseFloat(e.target.value) || 1 })}
                                    className="w-24"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {questions.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              const newQuestion: Question = {
                id: Date.now().toString(),
                type: 'multiple_choice',
                question: '',
                options: ['', '', '', ''],
                correctAnswer: '',
                explanation: '',
                points: 1,
                position: questions.length
              }
              onChange([...questions, newQuestion])
              setExpandedQuestionId(newQuestion.id)
            }}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Question
          </Button>

        </div>
      )}
    </div>
  )
}
