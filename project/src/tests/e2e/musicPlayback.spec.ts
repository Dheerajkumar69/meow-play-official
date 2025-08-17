/**
 * End-to-End Tests for Music Playback
 */
import { test, expect } from '@playwright/test';

test.describe('Music Playback Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"]');
  });

  test('should play a song from the library', async ({ page }) => {
    // Navigate to library
    await page.click('[data-testid="nav-library"]');
    
    // Wait for songs to load
    await page.waitForSelector('[data-testid="song-item"]');
    
    // Click on the first song
    const firstSong = page.locator('[data-testid="song-item"]').first();
    await firstSong.click();
    
    // Verify player bar appears
    await expect(page.locator('[data-testid="player-bar"]')).toBeVisible();
    
    // Verify play button shows pause icon
    await expect(page.locator('[data-testid="play-pause-btn"]')).toHaveAttribute('aria-label', /pause/i);
    
    // Verify song title is displayed
    const songTitle = await firstSong.locator('[data-testid="song-title"]').textContent();
    await expect(page.locator('[data-testid="current-song-title"]')).toHaveText(songTitle || '');
  });

  test('should pause and resume playback', async ({ page }) => {
    // Start playing a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Wait for playback to start
    await page.waitForSelector('[data-testid="player-bar"]');
    
    // Pause the song
    await page.click('[data-testid="play-pause-btn"]');
    await expect(page.locator('[data-testid="play-pause-btn"]')).toHaveAttribute('aria-label', /play/i);
    
    // Resume the song
    await page.click('[data-testid="play-pause-btn"]');
    await expect(page.locator('[data-testid="play-pause-btn"]')).toHaveAttribute('aria-label', /pause/i);
  });

  test('should skip to next and previous songs', async ({ page }) => {
    // Start playing from a playlist with multiple songs
    await page.click('[data-testid="nav-playlists"]');
    await page.waitForSelector('[data-testid="playlist-item"]');
    await page.locator('[data-testid="playlist-item"]').first().click();
    
    // Play first song in playlist
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Get current song title
    const firstSongTitle = await page.locator('[data-testid="current-song-title"]').textContent();
    
    // Skip to next song
    await page.click('[data-testid="next-btn"]');
    
    // Verify song changed
    const secondSongTitle = await page.locator('[data-testid="current-song-title"]').textContent();
    expect(secondSongTitle).not.toBe(firstSongTitle);
    
    // Skip back to previous song
    await page.click('[data-testid="prev-btn"]');
    
    // Verify we're back to the first song
    await expect(page.locator('[data-testid="current-song-title"]')).toHaveText(firstSongTitle || '');
  });

  test('should adjust volume', async ({ page }) => {
    // Start playing a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Wait for player bar
    await page.waitForSelector('[data-testid="player-bar"]');
    
    // Test volume slider
    const volumeSlider = page.locator('[data-testid="volume-slider"]');
    await volumeSlider.fill('0.5');
    
    // Verify volume changed
    await expect(volumeSlider).toHaveValue('0.5');
    
    // Test mute button
    await page.click('[data-testid="mute-btn"]');
    await expect(page.locator('[data-testid="mute-btn"]')).toHaveAttribute('aria-label', /unmute/i);
    
    // Unmute
    await page.click('[data-testid="mute-btn"]');
    await expect(page.locator('[data-testid="mute-btn"]')).toHaveAttribute('aria-label', /mute/i);
  });

  test('should toggle shuffle and repeat modes', async ({ page }) => {
    // Start playing a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Test shuffle toggle
    const shuffleBtn = page.locator('[data-testid="shuffle-btn"]');
    await shuffleBtn.click();
    await expect(shuffleBtn).toHaveClass(/active/);
    
    // Test repeat toggle
    const repeatBtn = page.locator('[data-testid="repeat-btn"]');
    await repeatBtn.click();
    await expect(repeatBtn).toHaveClass(/active/);
    
    // Click again to cycle through repeat modes
    await repeatBtn.click();
    await expect(repeatBtn).toHaveAttribute('aria-label', /repeat one/i);
    
    await repeatBtn.click();
    await expect(repeatBtn).not.toHaveClass(/active/);
  });

  test('should seek through the song', async ({ page }) => {
    // Start playing a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Wait for song to load and start playing
    await page.waitForSelector('[data-testid="progress-bar"]');
    await page.waitForTimeout(2000); // Let it play for a bit
    
    // Seek to middle of the song
    const progressBar = page.locator('[data-testid="progress-bar"]');
    const progressBarBox = await progressBar.boundingBox();
    
    if (progressBarBox) {
      // Click in the middle of the progress bar
      await page.mouse.click(
        progressBarBox.x + progressBarBox.width / 2,
        progressBarBox.y + progressBarBox.height / 2
      );
      
      // Verify time changed
      const currentTime = await page.locator('[data-testid="current-time"]').textContent();
      expect(currentTime).not.toBe('0:00');
    }
  });

  test('should like and unlike songs', async ({ page }) => {
    // Navigate to a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    
    const firstSong = page.locator('[data-testid="song-item"]').first();
    const likeBtn = firstSong.locator('[data-testid="like-btn"]');
    
    // Like the song
    await likeBtn.click();
    await expect(likeBtn).toHaveClass(/liked/);
    
    // Unlike the song
    await likeBtn.click();
    await expect(likeBtn).not.toHaveClass(/liked/);
  });

  test('should handle audio loading errors gracefully', async ({ page }) => {
    // Mock network failure for audio files
    await page.route('**/*.mp3', route => route.abort());
    await page.route('**/*.wav', route => route.abort());
    
    // Try to play a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Verify error message appears
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/failed to load/i);
  });

  test('should maintain playback state across navigation', async ({ page }) => {
    // Start playing a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Get current song info
    const songTitle = await page.locator('[data-testid="current-song-title"]').textContent();
    
    // Navigate to different pages
    await page.click('[data-testid="nav-search"]');
    await expect(page.locator('[data-testid="current-song-title"]')).toHaveText(songTitle || '');
    
    await page.click('[data-testid="nav-playlists"]');
    await expect(page.locator('[data-testid="current-song-title"]')).toHaveText(songTitle || '');
    
    // Verify playback continues
    await expect(page.locator('[data-testid="play-pause-btn"]')).toHaveAttribute('aria-label', /pause/i);
  });
});

test.describe('Queue Management', () => {
  test('should add songs to queue', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]');
    
    // Navigate to library
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    
    // Right-click on a song to open context menu
    const secondSong = page.locator('[data-testid="song-item"]').nth(1);
    await secondSong.click({ button: 'right' });
    
    // Add to queue
    await page.click('[data-testid="add-to-queue"]');
    
    // Open queue
    await page.click('[data-testid="queue-btn"]');
    
    // Verify song was added to queue
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(1);
  });

  test('should reorder queue items', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]');
    
    // Add multiple songs to queue
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    
    // Add first song
    await page.locator('[data-testid="song-item"]').first().click({ button: 'right' });
    await page.click('[data-testid="add-to-queue"]');
    
    // Add second song
    await page.locator('[data-testid="song-item"]').nth(1).click({ button: 'right' });
    await page.click('[data-testid="add-to-queue"]');
    
    // Open queue
    await page.click('[data-testid="queue-btn"]');
    
    // Verify we have 2 items
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(2);
    
    // Get first item title
    const firstItemTitle = await page.locator('[data-testid="queue-item"]').first()
      .locator('[data-testid="song-title"]').textContent();
    
    // Drag first item to second position
    const firstItem = page.locator('[data-testid="queue-item"]').first();
    const secondItem = page.locator('[data-testid="queue-item"]').nth(1);
    
    await firstItem.dragTo(secondItem);
    
    // Verify order changed
    const newFirstItemTitle = await page.locator('[data-testid="queue-item"]').first()
      .locator('[data-testid="song-title"]').textContent();
    
    expect(newFirstItemTitle).not.toBe(firstItemTitle);
  });
});

test.describe('Offline Playback', () => {
  test('should cache songs for offline playback', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]');
    
    // Navigate to a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    
    const firstSong = page.locator('[data-testid="song-item"]').first();
    
    // Right-click to open context menu
    await firstSong.click({ button: 'right' });
    
    // Download for offline
    await page.click('[data-testid="download-offline"]');
    
    // Verify download started
    await expect(page.locator('[data-testid="download-progress"]')).toBeVisible();
    
    // Wait for download to complete
    await page.waitForSelector('[data-testid="offline-indicator"]');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to play the cached song
    await firstSong.click();
    
    // Verify it plays offline
    await expect(page.locator('[data-testid="player-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="play-pause-btn"]')).toHaveAttribute('aria-label', /pause/i);
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-home"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-search"]')).toBeFocused();
    
    // Navigate to library with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-library"]')).toBeFocused();
    await page.keyboard.press('Enter');
    
    // Tab to first song
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="song-item"]').first()).toBeFocused();
    
    // Play song with keyboard
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="player-bar"]')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]');
    
    // Check navigation ARIA labels
    await expect(page.locator('[data-testid="nav-home"]')).toHaveAttribute('aria-label', /home/i);
    await expect(page.locator('[data-testid="nav-search"]')).toHaveAttribute('aria-label', /search/i);
    await expect(page.locator('[data-testid="nav-library"]')).toHaveAttribute('aria-label', /library/i);
    
    // Start playing a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Check player controls ARIA labels
    await expect(page.locator('[data-testid="play-pause-btn"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="prev-btn"]')).toHaveAttribute('aria-label', /previous/i);
    await expect(page.locator('[data-testid="next-btn"]')).toHaveAttribute('aria-label', /next/i);
    await expect(page.locator('[data-testid="volume-slider"]')).toHaveAttribute('aria-label', /volume/i);
  });

  test('should announce playback changes to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]');
    
    // Start playing a song
    await page.click('[data-testid="nav-library"]');
    await page.waitForSelector('[data-testid="song-item"]');
    await page.locator('[data-testid="song-item"]').first().click();
    
    // Check for live region updates
    await expect(page.locator('[aria-live="polite"]')).toContainText(/now playing/i);
    
    // Pause and check announcement
    await page.click('[data-testid="play-pause-btn"]');
    await expect(page.locator('[aria-live="polite"]')).toContainText(/paused/i);
  });
});
