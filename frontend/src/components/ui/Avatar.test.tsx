import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('renders initials when no src', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders image when src provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="Jane" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('applies size classes', () => {
    const { container } = render(<Avatar name="Test" size="lg" />)
    expect(container.firstChild).toHaveClass('w-12')
  })
})
