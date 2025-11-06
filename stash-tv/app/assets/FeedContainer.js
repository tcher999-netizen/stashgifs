/**
 * Feed Container
 * Main application container managing the feed
 */
import { StashAPI } from './StashAPI.js';
import { VideoPost } from './VideoPost.js';
import { VisibilityManager } from './VisibilityManager.js';
import { throttle } from './utils.js';
const DEFAULT_SETTINGS = {
    autoPlay: false,
    autoPlayThreshold: 0.5,
    maxConcurrentVideos: 3,
    unloadDistance: 1000,
    cardMaxWidth: 800,
    aspectRatio: 'preserve',
    showControls: 'hover',
    enableFullscreen: true,
};
export class FeedContainer {
    constructor(container, api, settings) {
        this.isLoading = false;
        this.container = container;
        this.api = api || new StashAPI();
        this.settings = { ...DEFAULT_SETTINGS, ...settings };
        this.posts = new Map();
        this.scenes = [];
        // Create scroll container
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.className = 'feed-scroll-container';
        this.container.appendChild(this.scrollContainer);
        // Initialize visibility manager
        this.visibilityManager = new VisibilityManager({
            threshold: this.settings.autoPlayThreshold,
            autoPlay: this.settings.autoPlay,
            maxConcurrent: this.settings.maxConcurrentVideos,
        });
        // Setup scroll handler
        this.setupScrollHandler();
    }
    /**
     * Initialize the feed
     */
    async init(filters) {
        this.currentFilters = filters;
        await this.loadVideos(filters);
    }
    /**
     * Load videos from Stash
     */
    async loadVideos(filters) {
        if (this.isLoading) {
            return;
        }
        this.isLoading = true;
        this.showLoading();
        try {
            console.log('FeedContainer: Fetching scenes...', filters || this.currentFilters);
            const scenes = await this.api.fetchScenes(filters || this.currentFilters);
            console.log('FeedContainer: Received scenes', scenes.length);
            this.scenes = scenes;
            if (scenes.length === 0) {
                this.showError('No videos found. Try adjusting your filters.');
                this.hideLoading();
                return;
            }
            // Clear existing posts
            this.clearPosts();
            // Create posts for each scene
            for (const scene of scenes) {
                await this.createPost(scene);
            }
            this.hideLoading();
        }
        catch (error) {
            console.error('Error loading videos:', error);
            this.showError(`Failed to load videos: ${error.message || 'Unknown error'}`);
            this.hideLoading();
        }
        finally {
            this.isLoading = false;
        }
    }
    /**
     * Create a video post
     */
    async createPost(scene) {
        const postContainer = document.createElement('article');
        postContainer.className = 'video-post-wrapper';
        const videoUrl = this.api.getVideoUrl(scene);
        const thumbnailUrl = this.api.getThumbnailUrl(scene);
        const postData = {
            scene,
            videoUrl,
            thumbnailUrl,
        };
        const post = new VideoPost(postContainer, postData);
        this.posts.set(scene.id, post);
        // Add to scroll container
        this.scrollContainer.appendChild(postContainer);
        // Observe for visibility
        this.visibilityManager.observePost(postContainer, scene.id);
        // Load video when it becomes visible (lazy loading)
        if (videoUrl) {
            // Use Intersection Observer to load video when near viewport
            const loadObserver = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        post.loadPlayer(videoUrl);
                        this.visibilityManager.registerPlayer(scene.id, post.getPlayer());
                        loadObserver.disconnect();
                    }
                }
            }, { rootMargin: '200px' });
            loadObserver.observe(postContainer);
        }
    }
    /**
     * Clear all posts
     */
    clearPosts() {
        for (const post of this.posts.values()) {
            post.destroy();
        }
        this.posts.clear();
        this.scrollContainer.innerHTML = '';
    }
    /**
     * Setup scroll handler
     */
    setupScrollHandler() {
        const handleScroll = throttle(() => {
            // Scroll handling can be used for additional features
            // like infinite scroll, etc.
        }, 100);
        this.scrollContainer.addEventListener('scroll', handleScroll);
    }
    /**
     * Show loading indicator
     */
    showLoading() {
        let loading = this.container.querySelector('.feed-loading');
        if (!loading) {
            loading = document.createElement('div');
            loading.className = 'feed-loading';
            loading.textContent = 'Loading videos...';
            this.container.appendChild(loading);
        }
        loading.style.display = 'block';
    }
    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = this.container.querySelector('.feed-loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    /**
     * Show error message
     */
    showError(message) {
        let error = this.container.querySelector('.feed-error');
        if (!error) {
            error = document.createElement('div');
            error.className = 'feed-error';
            this.container.appendChild(error);
        }
        error.textContent = message;
        error.style.display = 'block';
    }
    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        // Recreate visibility manager with new settings
        this.visibilityManager.cleanup();
        this.visibilityManager = new VisibilityManager({
            threshold: this.settings.autoPlayThreshold,
            autoPlay: this.settings.autoPlay,
            maxConcurrent: this.settings.maxConcurrentVideos,
        });
        // Re-observe all posts
        for (const post of this.posts.values()) {
            this.visibilityManager.observePost(post.getContainer(), post.getPostId());
            const player = post.getPlayer();
            if (player) {
                this.visibilityManager.registerPlayer(post.getPostId(), player);
            }
        }
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.visibilityManager.cleanup();
        this.clearPosts();
    }
}
//# sourceMappingURL=FeedContainer.js.map