/**
 * Visibility Manager
 * Handles video playback based on viewport visibility using Intersection Observer
 */
export class VisibilityManager {
    constructor(options) {
        this.options = {
            threshold: options?.threshold ?? 0.5,
            rootMargin: options?.rootMargin ?? '50px',
            autoPlay: options?.autoPlay ?? false,
            maxConcurrent: options?.maxConcurrent ?? 3,
        };
        this.entries = new Map();
        this.activeVideos = new Set();
        this.observer = new IntersectionObserver((intersectionEntries) => this.handleIntersection(intersectionEntries), {
            threshold: this.options.threshold,
            rootMargin: this.options.rootMargin,
        });
    }
    /**
     * Observe a post element
     */
    observePost(element, postId) {
        if (this.entries.has(postId)) {
            return;
        }
        this.entries.set(postId, {
            element,
            postId,
            isVisible: false,
        });
        this.observer.observe(element);
    }
    /**
     * Register a video player for a post
     */
    registerPlayer(postId, player) {
        const entry = this.entries.get(postId);
        if (entry) {
            entry.player = player;
        }
    }
    /**
     * Handle intersection changes
     */
    handleIntersection(entries) {
        for (const entry of entries) {
            const postId = this.findPostId(entry.target);
            if (!postId)
                continue;
            const visibilityEntry = this.entries.get(postId);
            if (!visibilityEntry)
                continue;
            const isVisible = entry.isIntersecting && entry.intersectionRatio >= this.options.threshold;
            const wasVisible = visibilityEntry.isVisible;
            visibilityEntry.isVisible = isVisible;
            if (isVisible && !wasVisible) {
                this.handlePostEnteredViewport(postId, visibilityEntry);
            }
            else if (!isVisible && wasVisible) {
                this.handlePostExitedViewport(postId, visibilityEntry);
            }
        }
    }
    findPostId(element) {
        // Traverse up to find the post container
        let current = element;
        while (current) {
            if (current.dataset.postId) {
                return current.dataset.postId;
            }
            current = current.parentElement;
        }
        return null;
    }
    handlePostEnteredViewport(postId, entry) {
        if (this.activeVideos.size >= this.options.maxConcurrent) {
            // Pause the oldest video
            const oldestId = Array.from(this.activeVideos)[0];
            this.pauseVideo(oldestId);
            this.activeVideos.delete(oldestId);
        }
        if (entry.player) {
            if (this.options.autoPlay) {
                entry.player.play();
            }
            this.activeVideos.add(postId);
        }
    }
    handlePostExitedViewport(postId, entry) {
        if (entry.player) {
            entry.player.pause();
            this.activeVideos.delete(postId);
        }
    }
    pauseVideo(postId) {
        const entry = this.entries.get(postId);
        if (entry?.player) {
            entry.player.pause();
        }
    }
    /**
     * Unobserve a post
     */
    unobservePost(postId) {
        const entry = this.entries.get(postId);
        if (entry) {
            this.observer.unobserve(entry.element);
            if (entry.player) {
                entry.player.destroy();
            }
            this.entries.delete(postId);
            this.activeVideos.delete(postId);
        }
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.observer.disconnect();
        for (const entry of this.entries.values()) {
            if (entry.player) {
                entry.player.destroy();
            }
        }
        this.entries.clear();
        this.activeVideos.clear();
    }
}
//# sourceMappingURL=VisibilityManager.js.map