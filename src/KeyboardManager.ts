/**
 * Keyboard Manager
 * Global keyboard shortcuts for feed navigation and playback control
 */

/**
 * Minimal interface for players used by KeyboardManager
 */
interface PlayerLike {
  getVideoElement?(): HTMLVideoElement;
  togglePlay?(): void;
  toggleFullscreen?(): void;
  seekTo?(time: number): void;
}

/**
 * Minimal interface for posts used by KeyboardManager
 */
interface PostLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPlayer(): any;
  getContainer(): HTMLElement;
}

export class KeyboardManager {
  private readonly getPostOrder: () => string[];
  private readonly getPost: (postId: string) => PostLike | undefined;
  private readonly getMostVisiblePostId: () => string | undefined;
  private readonly toggleGlobalMute: () => void;
  private readonly keydownHandler: (e: KeyboardEvent) => void;

  constructor(options: {
    getPostOrder: () => string[];
    getPost: (postId: string) => PostLike | undefined;
    getMostVisiblePostId: () => string | undefined;
    toggleGlobalMute: () => void;
  }) {
    this.getPostOrder = options.getPostOrder;
    this.getPost = options.getPost;
    this.getMostVisiblePostId = options.getMostVisiblePostId;
    this.toggleGlobalMute = options.toggleGlobalMute;

    this.keydownHandler = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);
  }

  private isInputFocused(): boolean {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || (active as HTMLElement).isContentEditable;
  }

  /**
   * Get the player for the most visible post, if it supports video operations
   */
  private getCurrentPlayer(): PlayerLike | undefined {
    const postId = this.getMostVisiblePostId();
    if (!postId) return undefined;
    const post = this.getPost(postId);
    if (!post) return undefined;
    const player = post.getPlayer();
    if (!player) return undefined;
    // Only return if it looks like a video player (has getVideoElement)
    if (typeof player.getVideoElement === 'function') {
      return player as PlayerLike;
    }
    return undefined;
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (this.isInputFocused()) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        this.navigatePost(-1);
        break;
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        this.navigatePost(1);
        break;
      case 'm':
        this.toggleMute();
        break;
      case 'f':
        this.toggleFullscreen();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.seek(-5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.seek(5);
        break;
      case 'Escape':
        this.closeDialogs();
        break;
    }
  }

  /**
   * Toggle play/pause on the most visible post's player
   */
  private togglePlayPause(): void {
    const player = this.getCurrentPlayer();
    if (player?.togglePlay) {
      player.togglePlay();
    }
  }

  /**
   * Navigate to next/previous post
   */
  private navigatePost(direction: number): void {
    const postOrder = this.getPostOrder();
    if (postOrder.length === 0) return;

    const currentId = this.getMostVisiblePostId();
    let targetIndex = 0;

    if (currentId) {
      const currentIndex = postOrder.indexOf(currentId);
      if (currentIndex !== -1) {
        targetIndex = currentIndex + direction;
      }
    }

    // Clamp to valid range
    targetIndex = Math.max(0, Math.min(postOrder.length - 1, targetIndex));

    const targetId = postOrder[targetIndex];
    const targetPost = this.getPost(targetId);
    if (targetPost) {
      const container = targetPost.getContainer();
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Toggle global mute state
   */
  private toggleMute(): void {
    this.toggleGlobalMute();
  }

  /**
   * Toggle fullscreen on the most visible post's player
   */
  private toggleFullscreen(): void {
    const player = this.getCurrentPlayer();
    if (player?.toggleFullscreen) {
      player.toggleFullscreen();
    }
  }

  /**
   * Seek the most visible post's video by a number of seconds
   */
  private seek(seconds: number): void {
    const player = this.getCurrentPlayer();
    if (!player) return;
    try {
      const videoElement = player.getVideoElement?.();
      if (videoElement) {
        const newTime = Math.max(0, Math.min(videoElement.duration || 0, videoElement.currentTime + seconds));
        player.seekTo?.(newTime);
      }
    } catch {
      // Video element may not be available
    }
  }

  /**
   * Close any open dialogs (rating, tag add, etc.)
   */
  private closeDialogs(): void {
    // Close any open overlays/dialogs by clicking outside or removing them
    const overlays = document.querySelectorAll('.rating-dialog, .tag-add-dialog, .dialog-overlay');
    for (const overlay of overlays) {
      (overlay as HTMLElement).remove();
    }
    // Also blur any focused element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  /**
   * Remove event listener and clean up
   */
  destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
  }
}
