import { test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Upload } from '../../pages/Upload';
import { MusicContext } from '../../contexts/MusicContext';
import { AuthContext } from '../../contexts/AuthContext';

test('file upload flow', async () => {
  const mockUpload = vi.fn();
  const mockAddToLibrary = vi.fn();
  
  // Mock context providers
  const mockMusicContext = {
    addToLibrary: mockAddToLibrary,
    // Add other required context values
  };

  const mockAuthContext = {
    user: { id: 'test-user' },
    // Add other required context values
  };

  render(
    <AuthContext.Provider value={mockAuthContext}>
      <MusicContext.Provider value={mockMusicContext}>
        <Upload />
      </MusicContext.Provider>
    </AuthContext.Provider>
  );

  // Create a mock file
  const file = new File(['mock audio content'], 'test-song.mp3', { type: 'audio/mpeg' });
  
  // Find and interact with the file input
  const input = screen.getByLabelText(/choose files/i);
  await userEvent.upload(input, file);
  
  // Check if file appears in the upload list
  expect(screen.getByText('test-song.mp3')).toBeInTheDocument();
  
  // Submit the upload
  const submitButton = screen.getByRole('button', { name: /upload/i });
  await userEvent.click(submitButton);
  
  // Wait for upload to complete and verify
  await waitFor(() => {
    expect(mockAddToLibrary).toHaveBeenCalledWith(expect.objectContaining({
      fileName: 'test-song.mp3',
      type: 'audio/mpeg'
    }));
  });
});
