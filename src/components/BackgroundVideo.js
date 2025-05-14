import React from "react";
import "../backgroundVideo.css";

/**
 * BackgroundVideo component
 * ------------------------
 * Renders a full-screen, looping, and muted YouTube video as the background of the app.
 * The video is styled to cover the entire viewport and stay behind all other content.
 *
 * - Uses an iframe with YouTube embed URL and loop parameters.
 * - The playlist param is set to the same video ID to enable looping.
 * - CSS ensures the video stretches and centers, and pointer events are disabled so UI remains interactive.
 */
const BackgroundVideo = () => (
  <div className="background-video-container">
    <iframe
      className="background-video"
      src="https://www.youtube.com/embed/jIQ6UV2onyI?autoplay=1&mute=1&controls=0&showinfo=0&autohide=1&loop=1&playlist=jIQ6UV2onyI&modestbranding=1&iv_load_policy=3&rel=0"
      title="Background Video"
      frameBorder="0"
      allow="autoplay; encrypted-media"
      allowFullScreen
    ></iframe>
  </div>
);

export default BackgroundVideo;
