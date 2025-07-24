let previewElement = null;
let currentSortColumn = -1;
let currentSortDirection = 1; // 1 for ascending, -1 for descending
let songData = [];            // Store the song data globally
let currentPreviewIndices = [];
let currentPreviewIndex = 0;
let ytPlayer = null;

function showInfo() {
  const modal = document.getElementById('info-modal');
  modal.style.display = 'block';
}

function hideInfo() {
  const modal = document.getElementById('info-modal');
  modal.style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
  const infoModal = document.getElementById('info-modal');
  const recentSongModal = document.getElementById('recent-song-modal');
  if (event.target === infoModal) {
    hideInfo();
  }
  if (event.target === recentSongModal) {
    hideRecentSong();
  }
}

function getIcon(url) {
  if (url.includes("youtu.be")) {
    return '<i class="fa-brands fa-youtube"></i>';
  } else if (url.includes("open.spotify.com")) {
    return '<i class="fa-brands fa-spotify"></i>';
  } else if (url.includes("soundcloud.com")) {
    return '<i class="fa-brands fa-soundcloud"></i>';
  } else if (url.includes("bilibili.com")) {
    return '<i class="fa-brands fa-bilibili"></i>';
  } else {
    return '<i class="fa-solid fa-music"></i>';
  }
}

function showPreview(url, event) {
  hidePreview();
  previewElement = document.createElement('div');
  previewElement.className = 'link-preview';
  previewElement.innerHTML = `
    <div class="preview-content">
      <div class="preview-loading">Loading preview...</div>
    </div>
  `;
  const rect = event.target.getBoundingClientRect();
  const offset = url.includes("youtu.be") ? 365
               : url.includes("spotify") || url.includes("soundcloud") ? 265
               : 275;
  let left = rect.left - offset;
  let top = rect.top;
  if (left < 10) left = 10;
  const previewHeight = 220;
  const viewportHeight = window.innerHeight;
  if (top + previewHeight > viewportHeight - 10) {
    top = viewportHeight - previewHeight - 10;
  }
  if (top < 10) top = 10;
  previewElement.style.left = left + 'px';
  previewElement.style.top = top + 'px';
  document.body.appendChild(previewElement);
  getPreviewImage(url, previewElement);
}

function hidePreview() {
  if (previewElement) {
    previewElement.remove();
    previewElement = null;
  }
}

function getPreviewImage(url, previewElement) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    getYouTubePreview(url, previewElement);
  } else if (url.includes('open.spotify.com')) {
    getSpotifyPreview(url, previewElement);
  } else if (url.includes('soundcloud.com')) {
    getSoundCloudPreview(url, previewElement);
  } else {
    previewElement.innerHTML = `
      <div class="preview-content">
        <div class="preview-fallback">Preview not available</div>
      </div>
    `;
  }
}

function getYouTubePreview(url, previewElement) {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    const img = new Image();
    img.onload = function() {
      previewElement.innerHTML = `
        <div class="preview-content">
          <img src="${thumbnailUrl}" alt="YouTube thumbnail" style="max-width: 300px; max-height: 200px;">
        </div>
      `;
    };
    img.onerror = function() {
      previewElement.innerHTML = `
        <div class="preview-content">
          <div class="preview-fallback">YouTube preview not available</div>
        </div>
      `;
    };
    img.src = thumbnailUrl;
  } else {
    previewElement.innerHTML = `
      <div class="preview-content">
        <div class="preview-fallback">YouTube preview not available</div>
      </div>
    `;
  }
}

function extractYouTubeId(url) {
  const match = url.match(/youtu\.be\/([^&\n?#]+)/);
  return match ? match[1] : null;
}

function getSpotifyPreview(url, previewElement) {
  const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
  fetch(oembedUrl)
    .then(response => response.json())
    .then(data => {
      if (data.thumbnail_url) {
        previewElement.innerHTML = `
          <div class="preview-content">
            <img src="${data.thumbnail_url}" alt="Spotify art cover" style="max-width: 300px; max-height: 200px;">
          </div>
        `;
      } else {
        throw new Error('No art cover available');
      }
    })
    .catch(() => {
      previewElement.innerHTML = `
        <div class="preview-content">
          <div class="preview-fallback">Spotify preview not available</div>
        </div>
      `;
    });
}

function getSoundCloudPreview(url, previewElement) {
  const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  fetch(oembedUrl)
    .then(response => response.json())
    .then(data => {
      if (data.thumbnail_url) {
        previewElement.innerHTML = `
          <div class="preview-content">
            <img src="${data.thumbnail_url}" alt="SoundCloud art cover" style="max-width: 300px; max-height: 200px;">
          </div>
        `;
      } else {
        throw new Error('No art cover available');
      }
    })
    .catch(() => {
      previewElement.innerHTML = `
        <div class="preview-content">
          <div class="preview-fallback">SoundCloud preview not available</div>
        </div>
      `;
    });
}

function showSongInModal(song) {
  hidePreview();
  const modal = document.getElementById('recent-song-modal');
  document.getElementById('recent-song-date').textContent = song.Date.split('T')[0];
  document.getElementById('recent-song-title').textContent = `${song.Artist} - ${song.Song}`;
  const playerContainer = document.getElementById('recent-song-player');
  const url = song.Link;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYouTubeId(url);
    playerContainer.innerHTML = `<div id="yt-player"></div>`;
    function createYT() {
      if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
        setTimeout(createYT, 100);
        return;
      }
      if (ytPlayer) {
        ytPlayer.destroy();
        ytPlayer = null;
      }
      ytPlayer = new YT.Player('yt-player', {
        height: '315',
        width: '560',
        videoId: videoId,
        playerVars: { autoplay: 1 },
        events: {
          'onStateChange': function(event) {
            if (event.data === YT.PlayerState.ENDED) {
              navigateSongPreview(1);
            }
          }
        }
      });
    }
    createYT();
  } else if (url.includes('soundcloud.com')) {
    playerContainer.innerHTML = `
      <iframe
        id="soundcloud-player"
        width="560"
        height="315"
        scrolling="no"
        frameborder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${url}&color=%2321b799&auto_play=true&visual=true">
      </iframe>
    `;
    if (ytPlayer) { ytPlayer.destroy(); ytPlayer = null; }
    if (window._soundcloudWidget) {
      try {
        window._soundcloudWidget.unbind && window._soundcloudWidget.unbind(SC.Widget.Events.FINISH);
      } catch (e) {}
      window._soundcloudWidget = null;
    }
    setTimeout(() => {
      const iframe = document.getElementById('soundcloud-player');
      if (iframe && window.SC && SC.Widget) {
        const widget = SC.Widget(iframe);
        window._soundcloudWidget = widget;
        widget.bind(SC.Widget.Events.FINISH, function() {
          navigateSongPreview(1);
        });
      }
    }, 500);
  } else if (url.includes('bilibili.com')) {
    playerContainer.innerHTML = `        
      <iframe 
        src=${url}
        scrolling="no"
        border="0"
        width="560"
        height="315"
        frameborder="0"
        framespacing="0"
        allowfullscreen>
      </iframe>
    `;
    if (ytPlayer) { ytPlayer.destroy(); ytPlayer = null; }
  } else if (url.includes('open.spotify.com')) {
    const spotifyId = url.split('/').pop().split('?')[0];
    playerContainer.innerHTML = `
      <iframe 
        style="border-radius:12px" 
        src="https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator" 
        width="100%" 
        height="352" 
        frameborder="0" 
        allowfullscreen="" 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy">
      </iframe>
    `;
    if (ytPlayer) { ytPlayer.destroy(); ytPlayer = null; }
  } else {
    playerContainer.innerHTML = `
      <div class="loading">
        <p>No embedded player available for this link type.</p>
        <a href="${url}" target="_blank" class="button">Open in new tab</a>
      </div>
    `;
    if (ytPlayer) { ytPlayer.destroy(); ytPlayer = null; }
  }
  modal.style.display = 'block';
}

function hideRecentSong() {
  const modal = document.getElementById('recent-song-modal');
  modal.style.display = 'none';
  const playerContainer = document.getElementById('recent-song-player');
  if (playerContainer) {
    playerContainer.innerHTML = '<div class="loading">Loading player...</div>';
  }
  if (ytPlayer) {
    ytPlayer.destroy();
    ytPlayer = null;
  }
}

// Inject shared info modal markup on page load
window.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('info-modal')) {
    const modal = document.createElement('div');
    modal.id = 'info-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="hideInfo()">&times;</span>
        <div class="info-content">
          <h2 class="text-center">About</h2>
          <p>I've always wanted to keep a diary of some sort, somewhere to jot my thoughts down so that I can look back at them. I've tried several times, but I can't get into the habit of actually doing it. Sometimes I'll forget, but other times I have trouble writing anything.</p>
          <p>But there is one thing I don't have to force myself to do: listening to music.</p>
          <p>Music is such a wonderful thing. It fills in the long periods of silence during those long rides on the train or in the car. It conveys all sorts of emotions that I have trouble expressing myself. And with the convenience of music streaming platforms, I can listen to whatever I feel like at the moment. Sometimes I'll even put the same song on loop for hours just because I like it that much.</p>
          <p>So then I started to keep a music diary, with the goal of writing down <strong id="highlight">one song a day</strong>. It could be a song that captures a specific moment or just something I happened to find or listen to on that day. I think of these songs as being associated with \"core memories\" - I can look back at each one and instantly remember what I was doing and how I felt on that day. The songs I choose might not mean anything to someone else, but they mean something to me.</p>
        </div>
      </div>
    `;

    const recentModal = document.getElementById('recent-song-modal');
    recentModal.parentNode.insertBefore(modal, recentModal);
  }
});