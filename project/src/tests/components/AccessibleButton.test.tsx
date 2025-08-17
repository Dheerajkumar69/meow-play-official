import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibleButton } from '../../components/AccessibleButton';

// Mock the useAccessibility hook
jest.mock('../../hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announce: jest.fn()
  })
}));

describe('AccessibleButton', () => {
  test('renders with correct ARIA attributes', () => {
    render(
      <AccessibleButton ariaLabel="Test button">
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Test button');
    expect(button).toHaveAttribute('role', 'button');
    expect(button).toHaveAttribute('tabIndex', '0');
  });

  test('meets minimum touch target size', () => {
    render(
      <AccessibleButton size="md">
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[44px]');
  });

  test('handles keyboard navigation', () => {
    const handleClick = jest.fn();
    render(
      <AccessibleButton onClick={handleClick}>
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Test Space key
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('shows loading state correctly', () => {
    render(
      <AccessibleButton loading={true}>
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  test('applies correct variant styles', () => {
    const { rerender } = render(
      <AccessibleButton variant="primary">
        Primary
      </AccessibleButton>
    );

    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-purple-600');

    rerender(
      <AccessibleButton variant="danger">
        Danger
      </AccessibleButton>
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });

  test('is disabled when disabled prop is true', () => {
    render(
      <AccessibleButton disabled={true}>
        Disabled
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('tabIndex', '-1');
  });
});
