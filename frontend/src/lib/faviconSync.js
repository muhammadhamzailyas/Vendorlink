/**
 * Favicon Synchronization
 * 
 * Manages the application favicon. 
 * Since the system has moved to a single light theme (Ink & Paper),
 * we default to the standard light favicon.
 */

// Icons defined in the project
const LIGHT_FAVICON = "/src/assets/Vendorlink Favicon Light.png";

/**
 * Updates the favicon in the document head
 */
export const updateFavicon = () => {
  const link = document.querySelector("link[rel~='icon']");
  if (!link) return;
  
  link.href = LIGHT_FAVICON;
};

// Initialize on load
if (typeof window !== "undefined") {
  updateFavicon();
}

export default updateFavicon;


