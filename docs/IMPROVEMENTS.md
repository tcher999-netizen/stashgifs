# StashGifs Improvements

Tracking document for all improvements made to the StashGifs plugin.

## Phase 1: Memory Leak Fixes

### 1A. BasePost lifecycle cleanup
- **Problem**: Every post added a global scroll listener in its constructor that was never removed on destroy. With hundreds of posts loaded, this caused severe memory bloat.
- **Fix**: Added `destroy()` method to `BasePost` that removes the scroll listener, aborts pending overlay fetch requests, clears overlay timeouts, removes overlay DOM elements, and cleans up hover handlers. All three subclasses (VideoPost, ImagePost, ImageVideoPost) now call `super.destroy()` instead of duplicating cleanup logic.
- **Files**: `BasePost.ts`, `VideoPost.ts`, `ImagePost.ts`, `ImageVideoPost.ts`

### 1B. Post pruning activation
- **Problem**: `FeedContainer.cleanupDistantPosts()` was fully implemented but never called anywhere. All posts stayed in memory forever as users scrolled.
- **Fix**: Wired `cleanupDistantPosts()` into two trigger points: (1) after new posts are appended via infinite scroll, and (2) on a debounced scroll handler (2s idle). Posts far from the viewport are now destroyed and removed from the DOM.
- **Files**: `FeedContainer.ts`

### 1C. PosterPreloader cancellation
- **Problem**: `PosterPreloader` created `Image` objects for prefetching with no way to cancel in-flight requests. Filter changes left stale fetches running.
- **Fix**: Changed `inflight` from `Set<string>` to `Map<string, HTMLImageElement>`. Added `cancelInflight()` method that aborts requests by setting `img.src = ''`. Called from `FeedContainer.clearPosts()`.
- **Files**: `PosterPreloader.ts`, `FeedContainer.ts`

---

## Phase 2: Player UX Improvements

### 2A. Keyboard shortcuts
- **New file**: `KeyboardManager.ts`
- **Shortcuts**:
  - `Space` - Play/pause current video
  - `j` / `ArrowDown` - Next post
  - `k` / `ArrowUp` - Previous post
  - `m` - Toggle mute
  - `f` - Toggle fullscreen
  - `ArrowLeft` / `ArrowRight` - Seek -5s / +5s
  - `Escape` - Close open dialogs
- Disabled when input fields or dialogs are focused
- **Files**: `KeyboardManager.ts`, `VisibilityManager.ts`, `FeedContainer.ts`

### 2B. Playback speed control
- Speed button in video controls bar cycling through [0.5, 0.75, 1, 1.25, 1.5, 2]x
- Displays current speed (e.g. "1.5x")
- Persists to localStorage (`stashgifs-playback-speed`)
- **Files**: `NativeVideoPlayer.ts`, `feed.css`

### 2C. Volume slider
- Vertical range slider revealed on hover over mute button area
- Sets video volume directly, icon updates based on level
- Persists to localStorage (`stashgifs-volume`)
- **Files**: `NativeVideoPlayer.ts`, `feed.css`

### 2D. Buffer indicator
- Visual bar behind progress slider showing buffered ranges
- Updates on `progress` events
- **Files**: `NativeVideoPlayer.ts`, `feed.css`

---

## Phase 3: Mobile UX

### 3A. Double-tap to favorite
- Double-tap on video/image area toggles favorite (same as heart button)
- Animated heart overlay appears at tap position and fades out
- Only active on mobile devices
- **Files**: `BasePost.ts`, `VideoPost.ts`, `ImagePost.ts`, `ImageVideoPost.ts`, `feed.css`

### 3B. Pull-to-refresh
- When scrolled to top of feed, pulling down triggers refresh
- Shows "Pull to refresh" / "Release to refresh" indicator
- Threshold: 80px pull distance
- Only active on mobile devices
- **Files**: `FeedContainer.ts`, `feed.css`

---

## Phase 4: Architecture Cleanup

### 4A. RatingControl extraction
- **New file**: `RatingControl.ts`
- Extracted ~400 lines of duplicated rating dialog logic from each post file
- Encapsulates: star rendering, dialog open/close, keyboard navigation, save/clear, half-precision support
- Each post file now creates a `RatingControl` instance instead of managing rating state directly
- ~1200 lines of duplication removed total
- **Files**: `RatingControl.ts`, `VideoPost.ts`, `ImagePost.ts`, `ImageVideoPost.ts`

### 4B. Shared constants
- **New file**: `constants.ts`
- Extracted duplicated constants: `FAVORITE_TAG_NAME`, `OCOUNT_DIGIT_WIDTH_PX`, `RATING_MAX_STARS`, `RATING_MIN_STARS`, `RESIZE_THROTTLE_MS`
- All post files and FavoritesManager now import from `constants.ts`
- **Files**: `constants.ts`, `VideoPost.ts`, `ImagePost.ts`, `ImageVideoPost.ts`, `FavoritesManager.ts`

---

## Phase 5: Accessibility & Polish

### 5A. prefers-reduced-motion
- Added `prefersReducedMotion()` utility to `utils.ts`
- Hover scale animations skipped when reduced motion preferred
- Autoplay disabled (unless explicitly triggered) when reduced motion preferred
- CSS media query disables all animations and transitions
- **Files**: `utils.ts`, `BasePost.ts`, `VisibilityManager.ts`, `feed.css`

### 5B. ARIA and focus management
- Added/updated `aria-label` attributes on all player controls (play, pause, mute, fullscreen, speed, volume, seek)
- Progress bar has `aria-valuemin` and `aria-valuemax`
- Settings tabs have `role="tablist"`, `role="tab"`, `aria-selected`
- Toggle switches have `role="switch"`, `aria-checked`
- **Files**: `NativeVideoPlayer.ts`, `SettingsPage.ts`, `BasePost.ts`

### 5C. Sort options
- Sort dropdown in feed header: Random, Newest, Rating, Most Viewed
- Persists to localStorage (`stashgifs-sort-order`)
- Maps to GraphQL sort parameters with descending direction
- Active sort highlighted with accent color
- **Files**: `FeedContainer.ts`, `StashAPI.ts`, `icons.ts`, `feed.css`
