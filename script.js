let previewElement = null;
let currentSortColumn = -1;
let currentSortDirection = 1; // 1 for ascending, -1 for descending
const URL = "https://music-diary-1573b-default-rtdb.firebaseio.com/data/main.json";

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
  const modal = document.getElementById('info-modal');
  if (event.target === modal) {
    hideInfo();
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
    html += `<td>${icon} <a href=${song["Link"]} target="_blank" class="preview-link" data-url="${song["Link"]}">${song["Song"]}</a></td>`;
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
  
  rows.forEach((row, index) => {
    // Skip header row
    if (index == 0) return;
    
    const tagCell = row.querySelector("td:nth-child(2)");
    if (!tagCell) return;
    
    const allTags = tagCell.textContent;
    const tagList = allTags.split(",").map(t => t.trim());
    
    if (tag === "All" || tagList.includes(tag)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  })
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
  
  // Get current active tag filter
  const activeButton = document.querySelector(".filter-button.active");
  const currentFilter = activeButton ? activeButton.textContent : "All";
  
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
      row.style.display = (matches && shouldShowByTag) ? "" : "none";
    }
  }
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
  previewElement.style.left = (rect.left - offset) + 'px';
  previewElement.style.top = rect.top + 'px';
  
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
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
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
    const data = arr.slice(1).reverse();
    createTable(data);
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