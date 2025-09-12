import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('text-red-500', true && 'bg-blue-500', false && 'text-green-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle undefined and null values', () => {
      expect(cn('text-red-500', undefined, null, 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle empty strings', () => {
      expect(cn('text-red-500', '', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500')
    })

    it('should handle objects with boolean values', () => {
      expect(cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'text-green-500': true,
      })).toBe('text-red-500 text-green-500')
    })

    it('should handle complex combinations', () => {
      expect(cn(
        'text-red-500',
        ['bg-blue-500', 'p-4'],
        {
          'text-green-500': false,
          'text-yellow-500': true,
        },
        'm-2'
      )).toBe('text-red-500 bg-blue-500 p-4 text-yellow-500 m-2')
    })

    it('should handle Tailwind CSS conflicts correctly', () => {
      // This tests that twMerge is working properly
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
      expect(cn('p-4', 'p-2')).toBe('p-2')
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })

    it('should handle no arguments', () => {
      expect(cn()).toBe('')
    })

    it('should handle single argument', () => {
      expect(cn('text-red-500')).toBe('text-red-500')
    })
  })
})
