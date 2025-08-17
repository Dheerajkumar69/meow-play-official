import { test, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../components/ErrorBoundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid polluting test output
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

test('ErrorBoundary catches and displays errors', () => {
  // Suppress console.error for expected error
  const spy = vi.spyOn(console, 'error');
  spy.mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  // Verify error message is displayed
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  expect(screen.getByText(/test error/i)).toBeInTheDocument();
  
  // Verify retry button is present
  const retryButton = screen.getByRole('button', { name: /try again/i });
  expect(retryButton).toBeInTheDocument();

  // Clean up
  spy.mockRestore();
});

test('ErrorBoundary retry button resets the error state', async () => {
  const spy = vi.spyOn(console, 'error');
  spy.mockImplementation(() => {});

  const { rerender } = render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  // Verify initial error state
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

  // Click retry button
  await userEvent.click(screen.getByRole('button', { name: /try again/i }));

  // Update props to not throw
  rerender(
    <ErrorBoundary>
      <ThrowError shouldThrow={false} />
    </ErrorBoundary>
  );

  // Verify component recovered
  expect(screen.getByText('No error')).toBeInTheDocument();
  expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();

  // Clean up
  spy.mockRestore();
});

test('ErrorBoundary displays custom fallback if provided', () => {
  const spy = vi.spyOn(console, 'error');
  spy.mockImplementation(() => {});

  const error = new Error('Test error');
  const CustomFallback = (
    <div>Custom error: {error.message}</div>
  );

  render(
    <ErrorBoundary fallback={CustomFallback}>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  // Verify custom fallback is used
  expect(screen.getByText(/custom error: test error/i)).toBeInTheDocument();

  // Clean up
  spy.mockRestore();
});

test('ErrorBoundary renders children when no error occurs', () => {
  render(
    <ErrorBoundary>
      <ThrowError shouldThrow={false} />
    </ErrorBoundary>
  );

  // Verify normal content is displayed
  expect(screen.getByText('No error')).toBeInTheDocument();
  expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
});
