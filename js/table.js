const URL = "https://music-diary-1573b-default-rtdb.firebaseio.com/data/main.json";

function createTable(data) {
  const table = document.getElementById("music-table");
  let html = "";
  html += "<tr>";
  html += "<th onclick='sortTable(0)'>Date ▼</th>";
  html += "<th onclick='sortTable(1)'>Tags ▼</th>";
  html += "<th onclick='sortTable(2)'>Artist ▼</th>";
  html += "<th onclick='sortTable(3)'>Song ▼</th>";
  data.forEach((song, index) => {
    const icon = getIcon(song["Link"]);
    html += "<tr>";
    html += `<td>${song["Date"].split("T")[0]}</td>`;
    html += `<td>${song["Tags"]}</td>`;
    html += `<td>${song["Artist"]}</td>`;
    html += `<td>${icon} <a href="#" onclick="showSongInPopup(${index}); return false;" class="preview-link" data-url="${song["Link"]}">${song["Song"]}</a></td>`;
    html += "</tr>";
  });
  table.innerHTML = html;
  addPreviewEvents();
}

function sortTable(columnIndex) {
  const table = document.getElementById("music-table");
  const rows = Array.from(table.querySelectorAll("tr")).slice(1); // Skip header row
  if (currentSortColumn == columnIndex) {
    currentSortDirection *= -1;
  } else {
    currentSortColumn = columnIndex;
    currentSortDirection = 1;
  }
  rows.sort((a, b) => {
    const aValue = a.cells[columnIndex].textContent.trim();
    const bValue = b.cells[columnIndex].textContent.trim();
    if (columnIndex == 0) {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      return (aDate - bDate) * currentSortDirection;
    }
    return aValue.localeCompare(bValue) * currentSortDirection;
  });
  rows.forEach(row => table.appendChild(row));
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
  const filterButtons = document.querySelectorAll(".filter-button");
  filterButtons.forEach(btn => btn.classList.remove("active"));
  const activeButton = document.querySelector(`button[onclick="filterRows('${tag}')"]`);
  if (activeButton) activeButton.classList.add("active");
  let visibleCount = 0;
  rows.forEach((row, index) => {
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
  });
  const resultsCounter = document.getElementById("results-counter");
  resultsCounter.textContent = `Returned ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
}

function randomizeSongs() {
  const table = document.getElementById("music-table");
  const rows = Array.from(table.querySelectorAll("tr"));
  const dataRows = rows.slice(1);
  for (let i = dataRows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dataRows[i], dataRows[j]] = [dataRows[j], dataRows[i]];
  }
  while (table.children.length > 1) {
    table.removeChild(table.lastChild);
  }
  dataRows.forEach(row => table.appendChild(row));
  const visibleRows = dataRows.filter(row => row.style.display !== "none");
  const resultsCounter = document.getElementById("results-counter");
  resultsCounter.textContent = `Returned ${visibleRows.length} result${visibleRows.length !== 1 ? 's' : ''}`;
}

function searchTable() {
  const searchInput = document.getElementById("search-input");
  const searchTerm = searchInput.value.toLowerCase().trim();
  const table = document.getElementById("music-table");
  const rows = table.querySelectorAll("tr");
  const resultsCounter = document.getElementById("results-counter");
  const activeButton = document.querySelector(".filter-button.active");
  const currentFilter = activeButton ? activeButton.textContent : "All";
  let visibleCount = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll("td");
    if (cells.length >= 4) {
      const date = cells[0].textContent.toLowerCase();
      const tags = cells[1].textContent.toLowerCase();
      const artist = cells[2].textContent.toLowerCase();
      const song = cells[3].textContent.toLowerCase();
      const matches = date.includes(searchTerm) || tags.includes(searchTerm) || artist.includes(searchTerm) || song.includes(searchTerm);
      const tagCell = cells[1];
      const allTags = tagCell.textContent;
      const tagList = allTags.split(",").map(t => t.trim());
      const shouldShowByTag = currentFilter === "All" || tagList.includes(currentFilter);
      const isVisible = matches && shouldShowByTag;
      row.style.display = isVisible ? "" : "none";
      if (isVisible) visibleCount++;
    }
  }
  resultsCounter.textContent = `Returned ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
}

function addPreviewEvents() {
  const links = document.querySelectorAll('.preview-link');
  links.forEach(link => {
    let previewTimeout;
    link.addEventListener('mouseenter', function(e) {
      const url = this.getAttribute('data-url');
      previewTimeout = setTimeout(() => {
        showPreview(url, e);
      }, 200);
    });
    link.addEventListener('mouseleave', function() {
      clearTimeout(previewTimeout);
      if (previewElement) {
        hidePreview();
      }
    });
  });
}

// Table-specific fetch/init
fetch(URL)
  .then((res) => res.json())
  .then((arr) => {
    songData = arr.slice(1).reverse();
    createTable(songData);
    const resultsCounter = document.getElementById("results-counter");
    const table = document.getElementById("music-table");
    const visibleRows = table.querySelectorAll("tr").length - 1;
    resultsCounter.textContent = `Returned ${visibleRows} result${visibleRows !== 1 ? 's' : ''}`;
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    const mostRecentSongDate = songData[0] ? songData[0].Date.split('T')[0] : null;
    if (lastVisitDate !== mostRecentSongDate) {
      setTimeout(() => {
        showRecentSong();
        localStorage.setItem('lastVisitDate', mostRecentSongDate);
      }, 1000);
    }
  })
  .catch((err) => console.error("Error loading sheet:", err));

function getVisibleSongIndices() {
  const table = document.getElementById("music-table");
  const rows = table.querySelectorAll("tr");
  let indices = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].style.display !== "none") {
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
  currentPreviewIndices = getVisibleSongIndices();
  currentPreviewIndex = currentPreviewIndices.indexOf(songIndex);
  if (currentPreviewIndex == -1) {
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

document.addEventListener('keydown', function(event) {
  if (event.target.id === 'search-input') return;
  switch(event.key.toLowerCase()) {
    case 't':
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'b':
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      break;
    case 'r':
      randomizeSongs();
      break;
  }
});