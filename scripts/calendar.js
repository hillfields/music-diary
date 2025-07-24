const URL = "https://music-diary-1573b-default-rtdb.firebaseio.com/data/main.json";

// Calendar state
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let songsByDate = new Map(); // Map to store songs by date
let earliestMonth = null; // Track earliest month with songs
let earliestYear = null;
let latestMonth = null; // Track latest month with songs  
let latestYear = null;

function createCalendar(data) {
  // Organize songs by date - show all songs
  songsByDate.clear();
  data.forEach((song, index) => {
    const dateKey = song["Date"].split("T")[0];
    songsByDate.set(dateKey, { ...song, index });
  });
  // Calculate earliest and latest months with songs
  calculateMonthBounds();
  renderCalendar();
}

function calculateMonthBounds() {
  if (songData.length === 0) return;
  let earliestDate = null;
  let latestDate = null;
  songData.forEach(song => {
    const songDate = new Date(song.Date);
    if (!earliestDate || songDate < earliestDate) {
      earliestDate = songDate;
    }
    if (!latestDate || songDate > latestDate) {
      latestDate = songDate;
    }
  });
  if (earliestDate) {
    earliestMonth = earliestDate.getMonth();
    earliestYear = earliestDate.getFullYear();
  }
  if (latestDate) {
    latestMonth = latestDate.getMonth();
    latestYear = latestDate.getFullYear();
  }
}

function renderCalendar() {
  const calendarGrid = document.getElementById("calendar-grid");
  const currentMonthElement = document.getElementById("current-month");
  const monthNames = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];
  currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  let mostRecentDate = null;
  if (songData.length > 0) {
    mostRecentDate = songData[0].Date.split("T")[0];
  }
  let html = "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();
  for (let i = 0; i < startingDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const song = songsByDate.get(dateString);
    let dayClass = 'calendar-day';
    if (song) {
      dayClass += ' has-song';
      if (dateString === mostRecentDate) {
        dayClass += ' most-recent';
      }
    } else {
      dayClass += ' empty';
    }
    html += `<div class="${dayClass}"`;
    if (song) {
      html += ` onclick="showSongInPopup(${song.index})"`;
    }
    html += '>';
    html += `<div class="calendar-day-number">${day}</div>`;
    if (song) {
      html += `<div class="calendar-song-thumbnail" data-url="${song.Link}"></div>`;
      html += `<div class="calendar-song">`;
      html += `<span class="calendar-song-icon">${getIcon(song.Link)}</span>`;
      html += `${song.Song}</div>`;
      html += `<div class="calendar-song-artist">${song.Artist}</div>`;
    }
    html += '</div>';
  }
  calendarGrid.innerHTML = html;
  loadCalendarThumbnails();
  updateMonthNavigationButtons();
}

function loadCalendarThumbnails() {
  const thumbnailElements = document.querySelectorAll('.calendar-song-thumbnail');
  thumbnailElements.forEach(element => {
    const url = element.getAttribute('data-url');
    if (url) {
      loadThumbnail(url, element);
    }
  });
}

function loadThumbnail(url, element) {
  if (url.includes("youtu.be") || url.includes("youtube.com")) {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      const img = new Image();
      img.onload = function() {
        element.style.backgroundImage = `url(https://img.youtube.com/vi/${videoId}/mqdefault.jpg)`;
        element.classList.add('thumbnail-loaded');
      };
      img.onerror = function() {
        element.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23ff0000\"/><text x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"40\">♪</text></svg>')`;
        element.classList.add('thumbnail-loaded');
      };
      img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    } else {
      element.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23ff0000\"/><text x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"40\">♪</text></svg>')`;
      element.classList.add('thumbnail-loaded');
    }
  } else if (url.includes("open.spotify.com")) {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    fetch(oembedUrl)
      .then(response => response.json())
      .then(data => {
        if (data.thumbnail_url) {
          element.style.backgroundImage = `url('${data.thumbnail_url}')`;
        } else {
          element.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%231DB954\"/><text x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"40\">♪</text></svg>')`;
        }
        element.classList.add('thumbnail-loaded');
      })
      .catch(() => {
        element.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"%231DB954\"><rect width=\"100\" height=\"100\"/><text x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"40\">♪</text></svg>')`;
        element.classList.add('thumbnail-loaded');
      });
  } else if (url.includes("soundcloud.com")) {
    const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    fetch(oembedUrl)
      .then(response => response.json())
      .then(data => {
        if (data.thumbnail_url) {
          element.style.backgroundImage = `url('${data.thumbnail_url}')`;
        } else {
          element.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23ff7700\"/><text x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"40\">♪</text></svg>')`;
        }
        element.classList.add('thumbnail-loaded');
      })
      .catch(() => {
        element.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23ff7700\"/><text x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"40\">♪</text></svg>')`;
        element.classList.add('thumbnail-loaded');
      });
  } else if (url.includes("bilibili.com")) {
    // For Bilibili, use a placeholder
    element.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%2300a1d6\"/><text x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"40\">♪</text></svg>')`;
    element.classList.add('thumbnail-loaded');
  } else {
    element.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23666\"/><text x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"40\">♪</text></svg>')`;
    element.classList.add('thumbnail-loaded');
  }
}

function changeMonth(direction) {
  const newMonth = currentMonth + direction;
  const newYear = currentYear;
  let adjustedMonth = newMonth;
  let adjustedYear = newYear;
  if (newMonth > 11) {
    adjustedMonth = 0;
    adjustedYear = newYear + 1;
  } else if (newMonth < 0) {
    adjustedMonth = 11;
    adjustedYear = newYear - 1;
  }
  if (earliestMonth !== null && latestMonth !== null) {
    const newDate = new Date(adjustedYear, adjustedMonth);
    const earliestDate = new Date(earliestYear, earliestMonth);
    const latestDate = new Date(latestYear, latestMonth);
    if (newDate < earliestDate || newDate > latestDate) {
      return;
    }
  }
  currentMonth = adjustedMonth;
  currentYear = adjustedYear;
  renderCalendar();
  updateMonthNavigationButtons();
}

function updateMonthNavigationButtons() {
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  if (!prevBtn || !nextBtn || earliestMonth === null || latestMonth === null) return;
  const currentDate = new Date(currentYear, currentMonth);
  const earliestDate = new Date(earliestYear, earliestMonth);
  const latestDate = new Date(latestYear, latestMonth);
  prevBtn.disabled = currentDate <= earliestDate;
  nextBtn.disabled = currentDate >= latestDate;
}

// Calendar-specific keyboard shortcuts (month navigation)
document.addEventListener('keydown', function(event) {
  if (event.target.id === 'search-input') return;
  const infoModal = document.getElementById('info-modal');
  const recentSongModal = document.getElementById('recent-song-modal');
  const infoOpen = infoModal && infoModal.style.display === 'block';
  const songOpen = recentSongModal && recentSongModal.style.display === 'block';
  if (!infoOpen && !songOpen) {
    if (event.key === 'ArrowLeft') {
      changeMonth(-1);
    } else if (event.key === 'ArrowRight') {
      changeMonth(1);
    }
  }
});

// Calendar-specific fetch/init
fetch(URL)
  .then((res) => res.json())
  .then((arr) => {
    songData = arr.slice(1).reverse();
    createCalendar(songData);
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
  // For calendar layout, return all song indices in chronological order (oldest to newest)
  // Since songData is in reverse chronological order, we need to reverse the indices
  return songData.map((song, index) => index).reverse();
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