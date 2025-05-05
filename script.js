let foldLines = [];
let sheetWidth = 500;
let sheetHeight = 300;
let currentZoom = 1;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let activeFoldLine = null;

// Toast notification function
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast';
  
  if (type) {
    toast.classList.add(type);
  }
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function drawSheet() {
  const btn = document.getElementById('update-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
  
  sheetWidth = parseInt(document.getElementById("width").value) || 500;
  sheetHeight = parseInt(document.getElementById("height").value) || 300;
  const svg = document.getElementById("sheet-svg");
  
  // Add updating animation
  svg.classList.add('updating');
  
  setTimeout(() => {
    // Clear and set SVG dimensions
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${sheetWidth + 20} ${sheetHeight + 20}`);
    svg.setAttribute('width', sheetWidth + 20);
    svg.setAttribute('height', sheetHeight + 20);
    
    // Draw sheet
    const sheet = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    sheet.setAttribute("x", "10");
    sheet.setAttribute("y", "10");
    sheet.setAttribute("width", sheetWidth);
    sheet.setAttribute("height", sheetHeight);
    sheet.setAttribute("fill", "#ffffff");
    sheet.setAttribute("stroke", "#334155");
    sheet.setAttribute("stroke-width", "2");
    svg.appendChild(sheet);
    
    // Draw fold lines
    foldLines.forEach((fold, index) => {
      const lineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      lineGroup.setAttribute('class', 'fold-line');
      lineGroup.setAttribute('data-index', index);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      if (fold.direction === 'horizontal') {
        line.setAttribute("x1", "10");
        line.setAttribute("y1", 10 + fold.position);
        line.setAttribute("x2", 10 + sheetWidth);
        line.setAttribute("y2", 10 + fold.position);
        
        // Arrow for bend direction
        const arrowX = 10 + sheetWidth / 2;
        const arrowY = 10 + fold.position;
        const arrowPath = fold.bend === 'up' 
          ? `M${arrowX-10},${arrowY-5} L${arrowX},${arrowY-15} L${arrowX+10},${arrowY-5}`
          : `M${arrowX-10},${arrowY+5} L${arrowX},${arrowY+15} L${arrowX+10},${arrowY+5}`;
        
        arrow.setAttribute("d", arrowPath);
      } else {
        line.setAttribute("x1", 10 + fold.position);
        line.setAttribute("y1", "10");
        line.setAttribute("x2", 10 + fold.position);
        line.setAttribute("y2", 10 + sheetHeight);
        
        // Arrow for bend direction
        const arrowX = 10 + fold.position;
        const arrowY = 10 + sheetHeight / 2;
        const arrowPath = fold.bend === 'up' 
          ? `M${arrowX-5},${arrowY-10} L${arrowX-15},${arrowY} L${arrowX-5},${arrowY+10}`
          : `M${arrowX+5},${arrowY-10} L${arrowX+15},${arrowY} L${arrowX+5},${arrowY+10}`;
        
        arrow.setAttribute("d", arrowPath);
      }
      
      line.setAttribute("stroke", "#dc2626");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-dasharray", "5,3");
      
      arrow.setAttribute("fill", fold.bend === 'up' ? "#f59e0b" : "#10b981");
      arrow.setAttribute("stroke", "#1e293b");
      arrow.setAttribute("stroke-width", "0.5");
      
      lineGroup.appendChild(line);
      lineGroup.appendChild(arrow);
      svg.appendChild(lineGroup);
    });
    
    // Remove animation class
    svg.classList.remove('updating');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Sheet';
    
    showToast('Sheet updated successfully!', 'success');
    
    // Apply current zoom and pan
    applyTransform();
  }, 300);
}

function addFoldLine() {
  const position = parseInt(document.getElementById("fold-position").value);
  const direction = document.getElementById("fold-direction").value;
  const bend = document.getElementById("fold-bend").value;
  
  if (isNaN(position)) {
    showToast("Please enter a valid position", "error");
    return;
  }
  
  const maxPosition = direction === 'horizontal' ? sheetHeight : sheetWidth;
  if (position < 0 || position > maxPosition) {
    showToast(`Position must be between 0 and ${maxPosition}mm for ${direction} fold`, "error");
    return;
  }
  
  foldLines.push({
    position,
    direction,
    bend
  });
  
  updateFoldLinesDisplay();
  drawSheet();
  document.getElementById("fold-position").value = '';
  showToast('Fold line added successfully!', 'success');
}

function removeFoldLine(index) {
  foldLines.splice(index, 1);
  updateFoldLinesDisplay();
  drawSheet();
  showToast('Fold line removed', 'success');
}

function updateFoldLinesDisplay() {
  const container = document.getElementById("fold-lines");
  container.innerHTML = "";
  
  foldLines.forEach((fold, index) => {
    const div = document.createElement("div");
    div.className = "fold-item";
    div.innerHTML = `
      <div class="fold-info">
        <span>${fold.position}mm</span>
        <span class="fold-direction">${fold.direction}</span>
        <span class="bend-direction bend-${fold.bend}">
          ${fold.bend === 'up' ? '↑' : '↓'}
        </span>
      </div>
      <button class="btn-danger" onclick="removeFoldLine(${index})">
        <i class="fas fa-trash"></i>
      </button>
    `;
    container.appendChild(div);
  });
}

function downloadSVG() {
  try {
    const svg = document.getElementById("sheet-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    saveAs(blob, "sheet-design.svg");
    showToast('SVG downloaded successfully!', 'success');
  } catch (e) {
    showToast('Error downloading SVG', 'error');
  }
}

function downloadPNG() {
  showToast('Generating PNG...', '');
  
  const svg = document.getElementById('sheet-svg');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas dimensions (2x for better quality)
  canvas.width = svg.width.baseVal.value * 2;
  canvas.height = svg.height.baseVal.value * 2;
  
  // Create SVG data URL
  const svgData = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  
  img.onload = function() {
    // Scale down for crisp rendering
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    
    // Convert to PNG and download
    canvas.toBlob(blob => {
      saveAs(blob, 'sheet-design.png');
      showToast('PNG downloaded successfully!', 'success');
    }, 'image/png', 1);
  };
  
  img.onerror = function() {
    showToast('Failed to generate PNG. Try SVG export instead.', 'error');
  };
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function downloadDXF() {
  try {
    // Simple DXF export
    let dxfContent = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
    
    // Add sheet outline
    dxfContent += `0\nLWPOLYLINE\n8\n0\n90\n4\n70\n1\n`;
    dxfContent += `10\n10\n20\n10\n`;
    dxfContent += `10\n${10 + sheetWidth}\n20\n10\n`;
    dxfContent += `10\n${10 + sheetWidth}\n20\n${10 + sheetHeight}\n`;
    dxfContent += `10\n10\n20\n${10 + sheetHeight}\n`;
    
    // Add fold lines
    foldLines.forEach(fold => {
      if (fold.direction === 'horizontal') {
        dxfContent += `0\nLINE\n8\nFOLDS\n`;
        dxfContent += `10\n10\n20\n${10 + fold.position}\n`;
        dxfContent += `11\n${10 + sheetWidth}\n21\n${10 + fold.position}\n`;
      } else {
        dxfContent += `0\nLINE\n8\nFOLDS\n`;
        dxfContent += `10\n${10 + fold.position}\n20\n10\n`;
        dxfContent += `11\n${10 + fold.position}\n21\n${10 + sheetHeight}\n`;
      }
    });
    
    dxfContent += `0\nENDSEC\n0\nEOF\n`;
    
    const blob = new Blob([dxfContent], {type: 'application/dxf'});
    saveAs(blob, 'sheet-design.dxf');
    showToast('DXF downloaded successfully!', 'success');
  } catch (e) {
    showToast('Error generating DXF', 'error');
  }
}

function saveDesign() {
  try {
    const design = {
      width: sheetWidth,
      height: sheetHeight,
      folds: foldLines,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('metalFabDesign', JSON.stringify(design));
    showToast('Design saved successfully!', 'success');
  } catch (e) {
    showToast('Error saving design', 'error');
  }
}

function loadDesign() {
  try {
    const savedDesign = localStorage.getItem('metalFabDesign');
    if (savedDesign) {
      const design = JSON.parse(savedDesign);
      document.getElementById("width").value = design.width;
      document.getElementById("height").value = design.height;
      foldLines = design.folds || [];
      updateFoldLinesDisplay();
      drawSheet();
      showToast('Design loaded successfully!', 'success');
    } else {
      showToast('No saved design found', 'error');
    }
  } catch (e) {
    showToast('Error loading design', 'error');
  }
}

// Zoom and pan functionality
function zoomIn() {
  currentZoom *= 1.2;
  applyTransform();
}

function zoomOut() {
  currentZoom /= 1.2;
  applyTransform();
}

function resetZoom() {
  currentZoom = 1;
  translateX = 0;
  translateY = 0;
  applyTransform();
}

function applyTransform() {
  const svg = document.getElementById('sheet-svg');
  svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  drawSheet();
  
  // Load design if available
  if (localStorage.getItem('metalFabDesign')) {
    loadDesign();
  }

  // Set up drag events for the SVG
  const svg = document.getElementById('sheet-svg');
  
  svg.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('fold-line')) {
      // Fold line drag
      activeFoldLine = parseInt(e.target.getAttribute('data-index'));
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
    } else {
      // Pan drag
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    if (activeFoldLine !== null) {
      // Move fold line
      const fold = foldLines[activeFoldLine];
      const svgRect = svg.getBoundingClientRect();
      const svgX = (e.clientX - svgRect.left - translateX) / currentZoom;
      const svgY = (e.clientY - svgRect.top - translateY) / currentZoom;
      
      if (fold.direction === 'horizontal') {
        const newPos = Math.max(0, Math.min(svgY - 10, sheetHeight));
        fold.position = Math.round(newPos);
      } else {
        const newPos = Math.max(0, Math.min(svgX - 10, sheetWidth));
        fold.position = Math.round(newPos);
      }
      
      drawSheet();
    } else {
      // Pan the view
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      applyTransform();
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    if (activeFoldLine !== null) {
      updateFoldLinesDisplay();
      activeFoldLine = null;
    }
  });

  // Touch events for mobile
  svg.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('fold-line')) {
      activeFoldLine = parseInt(e.target.getAttribute('data-index'));
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    }
  });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    if (activeFoldLine !== null) {
      const fold = foldLines[activeFoldLine];
      const svgRect = svg.getBoundingClientRect();
      const svgX = (e.touches[0].clientX - svgRect.left - translateX) / currentZoom;
      const svgY = (e.touches[0].clientY - svgRect.top - translateY) / currentZoom;
      
      if (fold.direction === 'horizontal') {
        const newPos = Math.max(0, Math.min(svgY - 10, sheetHeight));
        fold.position = Math.round(newPos);
      } else {
        const newPos = Math.max(0, Math.min(svgX - 10, sheetWidth));
        fold.position = Math.round(newPos);
      }
      
      drawSheet();
    } else {
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      applyTransform();
    }
    e.preventDefault();
  });

  document.addEventListener('touchend', () => {
    isDragging = false;
    if (activeFoldLine !== null) {
      updateFoldLinesDisplay();
      activeFoldLine = null;
    }
  });
});