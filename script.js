// Info modal functions
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

function getLinkIcon(link) {
  if (link.includes("youtu.be") || (link.includes("youtube.com"))) {
    return '<i class="fa-brands fa-youtube"></i>';
  } else if (link.includes("open.spotify.com")) {
    return '<i class="fa-brands fa-spotify"></i>';
  } else if (link.includes("soundcloud.com")) {
    return '<i class="fa-brands fa-soundcloud"></i>';
  } else {
    return '<i class="fa-solid fa-music"></i>';
  }
}

function createTable(data) {
  const table = document.getElementById("music-table");

  // Headings
  let html = "";
  html += "<tr>";
  html += "<th>Date</th>";
  html += "<th>Tags</th>";
  html += "<th>Artist</th>";
  html += "<th>Song</th>";

  // Rows
  data.forEach((song, index) => {
    const icon = getLinkIcon(song["Link"]);
    html += "<tr>";
    html += `<td>${song["Date"].split("T")[0]}</td>`;
    html += `<td>${song["Tags"]}</td>`;
    html += `<td>${song["Artist"]}</td>`;
    html += `<td>${icon} <a href=${song["Link"]} target="_blank">${song["Song"]}</a></td>`;
    html += "</tr>";
  })

  table.innerHTML = html;
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
  
  if (visibleRows.length === 0) {
    alert("No songs available to select from!");
    return;
  }
  
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
  }, 3000);
}

const URL = "https://music-diary-1573b-default-rtdb.firebaseio.com/data/main.json";

fetch(URL)
  .then((res) => res.json())
  .then((arr) => {
    const data = arr.slice(1).reverse();
    createTable(data);
  })
  .catch((err) => console.error("Error loading sheet:", err));

// Add keyboard event listener for 'r', 't', and 'b' keys
document.addEventListener('keydown', function(event) {
  const key = event.key.toLowerCase();
  if (key === 'r') {
    showRandomSong();
  } else if (key === 't') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (key === 'b') {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
});