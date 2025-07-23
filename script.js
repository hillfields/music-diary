let previewElement = null;
let currentSortColumn = -1;
let currentSortDirection = 1; // 1 for ascending, -1 for descending
let songData = [];            // Store the song data globally
const URL = "https://music-diary-1573b-default-rtdb.firebaseio.com/data/main.json";

// Track the current visible song indices and current index for preview navigation
let currentPreviewIndices = [];
let currentPreviewIndex = 0;

// For YouTube API player
let ytPlayer = null;
let ytPlayerReady = false;
let ytPlayerSongId = null;

// Called by YouTube API when ready
function onYouTubeIframeAPIReady() {
  ytPlayerReady = true;
}

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

function createTable(data) {
  const table = document.getElementById("music-table");

  // Headings
  let html = "";
  html += "<tr>";
  html += "<th onclick='sortTable(0)'>Date ▼</th>";
  html += "<th onclick='sortTable(1)'>Tags ▼</th>";
  html += "<th onclick='sortTable(2)'>Artist ▼</th>";
  html += "<th onclick='sortTable(3)'>Song ▼</th>";

  // Rows
  data.forEach((song, index) => {
    const icon = getIcon(song["Link"]);
    html += "<tr>";
    html += `<td>${song["Date"].split("T")[0]}</td>`;
    html += `<td>${song["Tags"]}</td>`;
    html += `<td>${song["Artist"]}</td>`;
    html += `<td>${icon} <a href="#" onclick="showSongInPopup(${index}); return false;" class="preview-link" data-url="${song["Link"]}">${song["Song"]}</a></td>`;
    html += "</tr>";
  })

  table.innerHTML = html;

  addPreviewEvents();
}

function sortTable(columnIndex) {
  const table = document.getElementById("music-table");
  const rows = Array.from(table.querySelectorAll("tr")).slice(1); // Skip header row
  
  // Determine sort direction
  if (currentSortColumn == columnIndex) {
    currentSortDirection *= -1; // Reverse direction
  } else {
    currentSortColumn = columnIndex;
    currentSortDirection = 1; // Start with ascending
  }
  
  // Sort the rows
  rows.sort((a, b) => {
    const aValue = a.cells[columnIndex].textContent.trim();
    const bValue = b.cells[columnIndex].textContent.trim();
    
    // Handle date sorting
    if (columnIndex == 0) {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      return (aDate - bDate) * currentSortDirection;
    }
    
    // Handle regular text sorting
    return aValue.localeCompare(bValue) * currentSortDirection;
  });
  
  // Update the table
  rows.forEach(row => table.appendChild(row));
  
  // Update header arrows
  updateSortArrows(columnIndex, currentSortDirection);
}

function updateSortArrows(columnIndex, direction) {
  const table = document.getElementById("music-table");
  const headers = table.querySelectorAll("th");
  
  headers.forEach((header, index) => {
    const baseText = header.textContent.replace(/[▲▼]/g, '').trim();
    if (index == columnIndex) {
      const triangle = direction == 1 ? ' ▲' : ' ▼';
      header.textContent = baseText + triangle;
    } else {
      header.textContent = baseText + ' ▼';
    }
  });
}

function filterRows(tag) {
  const table = document.getElementById("music-table");
  const rows = table.querySelectorAll("tr");
  
  // Update button highlighting
  const filterButtons = document.querySelectorAll(".filter-button");
  filterButtons.forEach(btn => {
    btn.classList.remove("active");
  });
  
  // Find and highlight the clicked button
  const activeButton = document.querySelector(`button[onclick="filterRows('${tag}')"]`);
  if (activeButton) {
    activeButton.classList.add("active");
  }
  
  let visibleCount = 0;
  
  rows.forEach((row, index) => {
    // Skip header row
    if (index == 0) return;
    
    const tagCell = row.querySelector("td:nth-child(2)");
    if (!tagCell) return;
    
    const allTags = tagCell.textContent;
    const tagList = allTags.split(",").map(t => t.trim());
    
    if (tag === "All" || tagList.includes(tag)) {
      row.style.display = "";
      visibleCount++;
    } else {
      row.style.display = "none";
    }
  })
  
  // Update results counter
  const resultsCounter = document.getElementById("results-counter");
  resultsCounter.textContent = `Returned ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
}

function showRandomSong() {
  const table = document.getElementById("music-table");
  const visibleRows = Array.from(table.querySelectorAll("tr")).filter((row, index) => {
    // Skip header row and hidden rows
    return index > 0 && row.style.display !== "none";
  });

  // Remove previous random highlighting
  table.querySelectorAll("tr").forEach(row => {
    row.classList.remove("random-highlight", "fade-out");
  });
  
  // Select a random visible row
  const randomIndex = Math.floor(Math.random() * visibleRows.length);
  const randomRow = visibleRows[randomIndex];
  
  // Highlight the random row
  randomRow.classList.add("random-highlight");
  
  // Scroll to the random row
  randomRow.scrollIntoView({ behavior: "smooth", block: "center" });
  
  // Start fade out after 2 seconds
  setTimeout(() => {
    randomRow.classList.add("fade-out");
  }, 2000);
  
  // Remove classes after fade completes
  setTimeout(() => {
    randomRow.classList.remove("random-highlight", "fade-out");
  }, 2500);
}

function searchTable() {
  const searchInput = document.getElementById("search-input");
  const searchTerm = searchInput.value.toLowerCase().trim();
  const table = document.getElementById("music-table");
  const rows = table.querySelectorAll("tr");
  const resultsCounter = document.getElementById("results-counter");
  
  // Get current active tag filter
  const activeButton = document.querySelector(".filter-button.active");
  const currentFilter = activeButton ? activeButton.textContent : "All";
  
  let visibleCount = 0;
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll("td");
    
    if (cells.length >= 4) {
      const date = cells[0].textContent.toLowerCase();
      const tags = cells[1].textContent.toLowerCase();
      const artist = cells[2].textContent.toLowerCase();
      const song = cells[3].textContent.toLowerCase();
      
      // Check if search term matches any of the fields
      const matches = date.includes(searchTerm) || 
                      tags.includes(searchTerm) || 
                      artist.includes(searchTerm) || 
                      song.includes(searchTerm);
      
      // Check if row should be visible based on tag filter
      const tagCell = cells[1];
      const allTags = tagCell.textContent;
      const tagList = allTags.split(",").map(t => t.trim());
      const shouldShowByTag = currentFilter === "All" || tagList.includes(currentFilter);
      
      // Show row if it matches search AND should be visible by tag filter
      const isVisible = matches && shouldShowByTag;
      row.style.display = isVisible ? "" : "none";
      
      if (isVisible) {
        visibleCount++;
      }
    }
  }
  
  // Update results counter
  resultsCounter.textContent = `Returned ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
}

function addPreviewEvents() {
  const links = document.querySelectorAll('.preview-link');
  
  links.forEach(link => {
    let previewTimeout;
    
    // Show preview when mouse hovers over the link
    link.addEventListener('mouseenter', function(e) {
      const url = this.getAttribute('data-url');
      previewTimeout = setTimeout(() => {
        showPreview(url, e);
      }, 200); // 200ms delay before showing preview
    });
    
    // Remove preview when mouse hovers away from the link
    link.addEventListener('mouseleave', function() {
      clearTimeout(previewTimeout);
      if (previewElement) {
        hidePreview();
      }
    });
  });
}

function showPreview(url, event) {  
  // Remove existing preview
  hidePreview();
  
  // Create preview element
  previewElement = document.createElement('div');
  previewElement.className = 'link-preview';
  previewElement.innerHTML = `
    <div class="preview-content">
      <div class="preview-loading">Loading preview...</div>
    </div>
  `;
  
  // Position the preview to the left of the song titles
  const rect = event.target.getBoundingClientRect();
  const offset = url.includes("youtu.be") ? 365
               : url.includes("spotify") || url.includes("soundcloud") ? 265
               : 275;
  
  let left = rect.left - offset;
  let top = rect.top;
  
  // Check if preview would go off the left edge
  if (left < 10) {
    left = 10;
  }
  
  // Check if preview would go off the bottom edge
  const previewHeight = 220; // max-height from CSS
  const viewportHeight = window.innerHeight;
  if (top + previewHeight > viewportHeight - 10) {
    top = viewportHeight - previewHeight - 10;
  }
  
  // Check if preview would go off the top edge
  if (top < 10) {
    top = 10;
  }
  
  previewElement.style.left = left + 'px';
  previewElement.style.top = top + 'px';
  
  document.body.appendChild(previewElement);
  
  // Try to get preview image
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
    // For other links, show a generic preview
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

    // Show YouTube thumbnail
    img.onload = function() {
      previewElement.innerHTML = `
        <div class="preview-content">
          <img src="${thumbnailUrl}" alt="YouTube thumbnail" style="max-width: 300px; max-height: 200px;">
        </div>
      `;
    };

    // Show fallback (preview not available) if image could not be loaded
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
  // Get artwork from Spotify
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
  // Get artwork from SoundCloud
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

fetch(URL)
  .then((res) => res.json())
  .then((arr) => {
    songData = arr.slice(1).reverse(); // Store data globally
    createTable(songData);
    // Update results counter after table is created
    const resultsCounter = document.getElementById("results-counter");
    const table = document.getElementById("music-table");
    const visibleRows = table.querySelectorAll("tr").length - 1; // Subtract header row
    resultsCounter.textContent = `Returned ${visibleRows} result${visibleRows !== 1 ? 's' : ''}`;
    
    // Show recent song popup if user hasn't seen the most recent song
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    const mostRecentSongDate = songData[0] ? songData[0].Date.split('T')[0] : null;
    
    if (lastVisitDate !== mostRecentSongDate) {
      setTimeout(() => {
        showRecentSong();
        localStorage.setItem('lastVisitDate', mostRecentSongDate);
      }, 1000); // Wait 1 second for page to load
    }
  })
  .catch((err) => console.error("Error loading sheet:", err));

// Add keyboard event listener for 'r', 't', and 'b' keys
document.addEventListener('keydown', function(event) {
  // Don't activate shortcuts if user is using search bar
  const searchInput = document.getElementById('search-input');
  if (searchInput && document.activeElement === searchInput) {
    return;
  }
  
  const key = event.key.toLowerCase();
  if (key === 'r') {
    showRandomSong();
  } else if (key === 't') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (key === 'b') {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
});

function getVisibleSongIndices() {
  const table = document.getElementById("music-table");
  const rows = table.querySelectorAll("tr");
  let indices = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].style.display !== "none") {
      // Extract the song index from the preview link's onclick attribute
      const link = rows[i].querySelector(".preview-link");
      if (link) {
        const match = link.getAttribute("onclick").match(/showSongInPopup\((\d+)\)/);
        if (match) {
          indices.push(parseInt(match[1], 10));
        }
      }
    }
  }
  return indices;
}

function showSongInPopup(songIndex) {
  if (songData.length == 0) {
    alert("No songs available!");
    return;
  }
  // Update visible indices and current index
  currentPreviewIndices = getVisibleSongIndices();
  currentPreviewIndex = currentPreviewIndices.indexOf(songIndex);
  if (currentPreviewIndex == -1) {
    // fallback: show first visible
    currentPreviewIndex = 0;
  }
  showSongInModal(songData[currentPreviewIndices[currentPreviewIndex]]);
  updatePreviewArrows();
}

function navigateSongPreview(direction) {
  if (!currentPreviewIndices.length) return;
  let newIndex = currentPreviewIndex + direction;
  if (newIndex < 0 || newIndex >= currentPreviewIndices.length) return;
  currentPreviewIndex = newIndex;
  showSongInModal(songData[currentPreviewIndices[currentPreviewIndex]]);
  updatePreviewArrows();
}

function updatePreviewArrows() {
  const leftBtn = document.getElementById('preview-arrow-left');
  const rightBtn = document.getElementById('preview-arrow-right');
  if (!leftBtn || !rightBtn) return;
  leftBtn.disabled = (currentPreviewIndex <= 0);
  rightBtn.disabled = (currentPreviewIndex >= currentPreviewIndices.length - 1);
}

// Optionally: Keyboard navigation for popup
window.addEventListener('keydown', function(e) {
  const modal = document.getElementById('recent-song-modal');
  if (modal && modal.style.display === 'block') {
    if (e.key === 'ArrowLeft') {
      navigateSongPreview(-1);
    } else if (e.key === 'ArrowRight') {
      navigateSongPreview(1);
    }
  }
});

function showRecentSong() {
  showSongInPopup(0);
}

function showSongInModal(song) {
  const modal = document.getElementById('recent-song-modal');
  
  // Update modal content
  document.getElementById('recent-song-date').textContent = song.Date.split('T')[0];
  document.getElementById('recent-song-title').textContent = `${song.Artist} - ${song.Song}`;
  
  // Create player based on link type
  const playerContainer = document.getElementById('recent-song-player');
  const url = song.Link;
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYouTubeId(url);
    ytPlayerSongId = videoId;
    playerContainer.innerHTML = `<div id="yt-player"></div>`;
    // Wait for API to be ready
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
              // Auto-next
              navigateSongPreview(1);
            }
          }
        }
      });
    }
    createYT();
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
  
  // Stop any playing media by clearing the iframe content
  const playerContainer = document.getElementById('recent-song-player');
  if (playerContainer) {
    playerContainer.innerHTML = '<div class="loading">Loading player...</div>';
  }
  if (ytPlayer) {
    ytPlayer.destroy();
    ytPlayer = null;
  }
}