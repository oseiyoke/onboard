'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseFormPersistenceOptions<T> {
  key: string
  defaultValues: T
  debounceMs?: number
  storage?: 'localStorage' | 'sessionStorage'
  serialize?: (data: T) => string
  deserialize?: (data: string) => T
}

export function useFormPersistence<T extends Record<string, any>>({
  key,
  defaultValues,
  debounceMs = 1000,
  storage = 'localStorage',
  serialize = JSON.stringify,
  deserialize = JSON.parse
}: UseFormPersistenceOptions<T>) {
  const [formData, setFormData] = useState<T>(defaultValues)
  const [isLoaded, setIsLoaded] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  // Load data from storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage
      const savedData = storageObj.getItem(key)
      
      if (savedData) {
        const parsed = deserialize(savedData)
        setFormData({ ...defaultValues, ...parsed })
      }
    } catch (error) {
      console.warn(`Failed to load form data for key "${key}":`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [key, storage, deserialize, defaultValues])

  // Save data to storage with debouncing
  const saveToStorage = useCallback((data: T) => {
    if (typeof window === 'undefined') return

    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage
      const serialized = serialize(data)
      storageObj.setItem(key, serialized)
    } catch (error) {
      console.warn(`Failed to save form data for key "${key}":`, error)
    }
  }, [key, storage, serialize])

  // Update form data with debounced persistence
  const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormData(prev => {
      const newData = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates }
      
      // Debounce the save operation
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        saveToStorage(newData)
      }, debounceMs)
      
      return newData
    })
  }, [saveToStorage, debounceMs])

  // Update a specific field
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    updateFormData({ [field]: value } as Partial<T>)
  }, [updateFormData])

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage
      storageObj.removeItem(key)
      setFormData(defaultValues)
    } catch (error) {
      console.warn(`Failed to clear form data for key "${key}":`, error)
    }
  }, [key, storage, defaultValues])

  // Reset to default values
  const resetForm = useCallback(() => {
    setFormData(defaultValues)
    clearPersistedData()
  }, [defaultValues, clearPersistedData])

  // Force save immediately (bypass debouncing)
  const forceSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    saveToStorage(formData)
  }, [saveToStorage, formData])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    formData,
    isLoaded,
    updateFormData,
    updateField,
    resetForm,
    clearPersistedData,
    forceSave
  }
}
