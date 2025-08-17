import { test, expect } from '@playwright/test';

test('complete user journey', async ({ page }) => {
  // Start from the home page
  await page.goto('http://localhost:5173');
  
  // Login flow
  await page.click('text=Login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for login and navigation
  await expect(page).toHaveURL('http://localhost:5173/library');
  
  // Upload a song
  await page.click('text=Upload');
  await page.setInputFiles('input[type="file"]', 'test-files/test-song.mp3');
  await page.click('text=Upload');
  
  // Verify song appears in library
  await expect(page.locator('text=test-song.mp3')).toBeVisible();
  
  // Create a playlist
  await page.click('text=New Playlist');
  await page.fill('input[placeholder="Playlist Name"]', 'My Test Playlist');
  await page.click('text=Create');
  
  // Add song to playlist
  await page.dragAndDrop('text=test-song.mp3', 'text=My Test Playlist');
  
  // Play the song
  await page.click('text=test-song.mp3');
  await expect(page.locator('.player-controls')).toBeVisible();
  
  // Verify audio is playing
  const isPlaying = await page.evaluate(() => {
    const audio = document.querySelector('audio');
    return audio ? !audio.paused : false;
  });
  expect(isPlaying).toBe(true);
});
