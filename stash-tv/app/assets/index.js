/**
 * Main entry point for Stash TV Feed UI
 */
import { FeedContainer } from './FeedContainer.js';
import { StashAPI } from './StashAPI.js';
// Initialize when DOM is ready
function init() {
    console.log('Stash TV Feed UI: Initializing...');
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error('App container not found');
        return;
    }
    // Create feed container
    appContainer.className = 'feed-container';
    // Show loading message
    appContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #fff;">Loading Stash TV Feed...</div>';
    try {
        // Initialize API (will use window.stash if available)
        console.log('Stash TV Feed UI: Creating API instance...');
        console.log('Stash TV Feed UI: window.PluginApi =', window.PluginApi);
        console.log('Stash TV Feed UI: window.stash =', window.stash);
        const api = new StashAPI();
        // Get settings from localStorage or use defaults
        const savedSettings = localStorage.getItem('stash-tv-settings');
        const settings = savedSettings
            ? JSON.parse(savedSettings)
            : {};
        // Create feed
        console.log('Stash TV Feed UI: Creating feed container...');
        const feed = new FeedContainer(appContainer, api, settings);
        // Initialize feed
        feed.init().catch((error) => {
            console.error('Failed to initialize feed:', error);
            appContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #fff;">
          <h2>Error Loading Feed</h2>
          <p>${error.message || 'Unknown error'}</p>
          <p style="font-size: 0.875rem; color: #999;">Check browser console for details</p>
        </div>
      `;
        });
        // Expose feed to window for debugging/extension
        window.stashTVFeed = feed;
        console.log('Stash TV Feed UI: Initialization complete');
    }
    catch (error) {
        console.error('Stash TV Feed UI: Fatal error during initialization:', error);
        appContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #fff;">
        <h2>Fatal Error</h2>
        <p>${error.message || 'Unknown error'}</p>
        <p style="font-size: 0.875rem; color: #999;">Check browser console for details</p>
      </div>
    `;
    }
}
// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}
//# sourceMappingURL=index.js.map