/**
 * Generate images based on a YouTube URL suitable for easily sharing
 *
 * # Created
 * Author: Dave Eddy <ysap@daveeddy.com>
 * Date: February 03, 2026
 * License: MIT
 *
 * # Contributors
 * - Dave Eddy <ysap@daveeddy.com>
 * - Christian Hase <christian@hase.hamburg>
 */

let lastVideoId = null;

const DEFAULT_FONT_FAMILY = 'Arial';
const FALLBACK_FONT_STACK = 'Arial, Helvetica, sans-serif';
const FONT_STORAGE_KEY = 'ysap-selected-font-family';

const CURATED_SYSTEM_FONTS = [
    'Arial',
    'Arial Black',
    'Bahnschrift',
    'Calibri',
    'Cambria',
    'Candara',
    'Comic Sans MS',
    'Consolas',
    'Courier New',
    'Georgia',
    'Helvetica',
    'Impact',
    'Lucida Console',
    'Lucida Sans Unicode',
    'Palatino Linotype',
    'Segoe UI',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
    'Avenir',
    'Avenir Next',
    'Charter',
    'Futura',
    'Gill Sans',
    'Helvetica Neue',
    'Menlo',
    'Monaco',
    'Optima',
    'San Francisco',
    'SF Pro Display',
    'SF Pro Text',
    'American Typewriter',
    'Andale Mono',
    'Baskerville',
    'Didot',
    'Geneva',
    'Hoefler Text',
    'Marker Felt',
    'Noteworthy',
    'Big Caslon',
    'Copperplate',
    'Apple Color Emoji',
    'Roboto',
    'Noto Sans',
    'Noto Serif',
    'Noto Color Emoji',
    'Ubuntu',
    'Cantarell',
    'DejaVu Sans',
    'DejaVu Serif',
    'DejaVu Sans Mono',
    'Liberation Sans',
    'Liberation Serif',
    'Liberation Mono',
    'Source Sans Pro',
    'Source Serif Pro',
    'Source Code Pro',
    'Droid Sans',
    'Droid Serif',
    'Droid Sans Mono',
    'Inter',
    'PT Sans',
    'PT Serif',
    'Open Sans',
    'Lato',
    'Merriweather',
    'Fira Sans',
    'Fira Mono',
    'JetBrains Mono',
    'Ubuntu Mono',
];

let selectedFontFamily = DEFAULT_FONT_FAMILY;
let availableFonts = new Set(CURATED_SYSTEM_FONTS);

function quoteFontFamily(value) {
    return `"${String(value || '').replace(/["\\]/g, '\\$&')}"`;
}

function resolveCanvasFont(sizePx, weight = 'normal') {
    const family = selectedFontFamily && selectedFontFamily.trim()
        ? selectedFontFamily.trim()
        : DEFAULT_FONT_FAMILY;
    return `${weight} ${sizePx}px ${quoteFontFamily(family)}, ${FALLBACK_FONT_STACK}`;
}

function notifyFontFallback(message) {
    const status = document.getElementById('font-status');
    if (!status) {
        return;
    }

    if (!message) {
        status.textContent = '';
        status.classList.remove('visible');
        return;
    }

    status.textContent = message;
    status.classList.add('visible');
}

function normalizeFontName(fontName) {
    return String(fontName || '').trim();
}

function sanitizeFontSelection(value) {
    const normalized = normalizeFontName(value);
    if (!normalized) {
        return DEFAULT_FONT_FAMILY;
    }
    return normalized;
}

function checkSelectedFontAvailable() {
    if (!document.fonts || typeof document.fonts.check !== 'function') {
        return true;
    }

    const family = sanitizeFontSelection(selectedFontFamily);
    return document.fonts.check(`16px ${quoteFontFamily(family)}`);
}

function applySelectedFont(value) {
    selectedFontFamily = sanitizeFontSelection(value);

    const fontInput = document.getElementById('font-select');
    if (fontInput) {
        fontInput.value = selectedFontFamily;
    }

    try {
        localStorage.setItem(FONT_STORAGE_KEY, selectedFontFamily);
    } catch (err) {
        console.warn('failed to persist font selection', err);
    }

    const supported = availableFonts.has(selectedFontFamily) || checkSelectedFontAvailable();
    if (!supported) {
        notifyFontFallback(`Selected font "${selectedFontFamily}" is unavailable. Falling back to ${FALLBACK_FONT_STACK}.`);
        return;
    }

    notifyFontFallback('');
}

function uniqueSortedFonts(fonts) {
    return Array.from(new Set(fonts.filter(Boolean).map((f) => String(f).trim()).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b));
}

async function getSystemFonts() {
    const merged = new Set(CURATED_SYSTEM_FONTS);

    if (typeof window.queryLocalFonts === 'function') {
        try {
            const localFonts = await window.queryLocalFonts();
            for (const fontData of localFonts) {
                if (fontData.family) {
                    merged.add(fontData.family);
                }
                if (fontData.fullName) {
                    merged.add(fontData.fullName);
                }
            }
        } catch (err) {
            console.warn('queryLocalFonts unavailable or denied', err);
            notifyFontFallback('Local font access unavailable; showing a curated system font list.');
        }
    }

    return uniqueSortedFonts(Array.from(merged));
}

function populateFontOptions(fonts) {
    const datalist = document.getElementById('font-options');
    if (!datalist) {
        return;
    }

    datalist.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (const fontName of fonts) {
        const opt = document.createElement('option');
        opt.value = fontName;
        fragment.appendChild(opt);
    }
    datalist.appendChild(fragment);
}

async function initFontPicker() {
    const fontInput = document.getElementById('font-select');
    if (!fontInput) {
        return;
    }

    const systemFonts = await getSystemFonts();
    availableFonts = new Set(systemFonts);
    populateFontOptions(systemFonts);

    let savedFont = DEFAULT_FONT_FAMILY;
    try {
        const fromStorage = localStorage.getItem(FONT_STORAGE_KEY);
        if (fromStorage) {
            savedFont = fromStorage;
        }
    } catch (err) {
        console.warn('failed to load saved font selection', err);
    }

    if (!availableFonts.has(savedFont)) {
        availableFonts.add(savedFont);
        populateFontOptions(uniqueSortedFonts(Array.from(availableFonts)));
    }

    fontInput.addEventListener('change', function onFontChange() {
        applySelectedFont(fontInput.value);
    });

    fontInput.addEventListener('keydown', function onFontKeydown(event) {
        if (event.key === 'Enter') {
            applySelectedFont(fontInput.value);
        }
    });

    applySelectedFont(savedFont);
}

// toggle dropdown
function toggleDropdown() {
    const dropdown = document.getElementById("myDropdown");
    dropdown.classList.toggle("show");
    
    // Update ARIA state
    const btn = document.querySelector('.dropbtn');
    if (btn) {
        const expanded = dropdown.classList.contains("show");
        btn.setAttribute('aria-expanded', expanded);
    }
}

// Close the dropdown if the user clicks outside of it
window.addEventListener('click', function(event) {
    if (!event.target.closest('.dropbtn')) {
        const dropdowns = Array.from(document.getElementsByClassName("dropdown-content"));
        dropdowns.forEach((openDropdown) => {
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
                // Reset ARIA state
                const btn = document.querySelector('.dropbtn');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            }
        });
    }
});

// Keyboard accessibility for dropdown
window.addEventListener('keydown', function(event) {
    const key = event.key;
    const active = document.activeElement;
    
    // Close on Escape
    if (key === 'Escape' || key === 'Esc') {
        const dropdowns = Array.from(document.getElementsByClassName("dropdown-content"));
        let closedSomething = false;
        dropdowns.forEach((openDropdown) => {
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
                openDropdown.previousElementSibling.setAttribute('aria-expanded', 'false');
                closedSomething = true;
            }
        });
        
        if (closedSomething) {
             const btn = document.querySelector('.dropbtn');
             if (btn) btn.focus();
        }
        return;
    }

    // Toggle with Enter/Space on button
    if (active && active.closest('.dropbtn')) {
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
            event.preventDefault();
            toggleDropdown();
            return;
        }
    }
    
    // Arrow key navigation
    const openMenu = document.querySelector('.dropdown-content.show');
    
    // Only intercept arrow keys if focusing the button or inside the menu
    if (openMenu && active && (openMenu.contains(active) || active.closest('.dropbtn'))) {
         const items = Array.from(openMenu.querySelectorAll('a'));
         
         if (key === 'ArrowDown' || key === 'Down') {
             event.preventDefault();
             // Focus first, or next
             if (!openMenu.contains(active)) {
                 if (items.length > 0) items[0].focus();
             } else {
                 const index = items.indexOf(active);
                 const nextIndex = (index + 1) % items.length;
                 items[nextIndex].focus();
             }
         } else if (key === 'ArrowUp' || key === 'Up') {
             event.preventDefault();
             if (openMenu.contains(active)) {
                 const index = items.indexOf(active);
                 const prevIndex = (index - 1 + items.length) % items.length;
                 items[prevIndex].focus();
             }
         }
    } else if (active && active.closest('.dropbtn') && (key === 'ArrowDown' || key === 'Down')) {
        // Allow opening with Down arrow if focused on button
        event.preventDefault();
        toggleDropdown();
        // Focus first item if it opens
        setTimeout(() => {
             const dropdown = document.getElementById("myDropdown");
             if (dropdown.classList.contains("show")) {
                 const firstItem = dropdown.querySelector('a');
                 if (firstItem) firstItem.focus();
             }
        }, 0);
    }
});

// allow user to press enter
let urlInput = document.getElementById('url-input');
if (urlInput) {
    urlInput.addEventListener('keypress', function onevent(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            generate();
        }
    });
}

initFontPicker();

// print a message and just DIE
function fatal(s) {
    alert(s);
    console.error(s);
    throw s;
}

function videoIdToThumbnail(videoId) {
    return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

function shortUrl(videoId) {
    return `https://youtu.be/${videoId}`;
}

// helper to calculate text wrap
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth) {
            lines.push(line.trim());
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    if (line) {
        lines.push(line.trim());
    }
    return lines;
}

// extract the ID portion of a youtube URL
function getYouTubeID(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        fatal(e);
        return;
    }

    if (parsed.hostname === 'youtu.be') {
        // youtu.be/video-id
        return parsed.pathname.slice(1);
    }
    if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.split('/').includes('live')) {
            // youtube.com/live/video-id
            return parsed.pathname.split('/')[2]
        } else {
            // youtube.com/watch?v=video-id
            return parsed.searchParams.get('v');
        }
    }
    fatal('failed to extract youtube ID from URL');
}

// download all button clicked
function downloadAll() {
    if (!lastVideoId) {
        return;
    }

    let output = document.getElementById('output');
    Array.from(output.children).forEach(function (a, i) {
        setTimeout(function () {
            // simulate clicking the link
            console.log('clicking');
            console.log(a);
            a.click();
        }, i * 300);
    });
}

// download as zip
function downloadZip() {
    if (typeof JSZip === 'undefined') {
        alert("JSZip library not loaded. Please wait and try again.");
        return;
    }

    if (!lastVideoId) {
        alert("No images are available to download. Please generate thumbnails first.");
        return;
    }

    const zip = new JSZip();
    const output = document.getElementById('output');
    // Ensure we are selecting the 'a' tags inside output
    const anchors = output.querySelectorAll('a');
    
    Array.from(anchors).forEach(function(a) {
        const href = a.href;
        // filename is set on the anchor element
        const filename = a.download || `image-${Math.random().toString(36).substring(7)}.jpg`;

        if (href.startsWith('data:image')) {
            // Extract base64 part
            const parts = href.split(',');
            if (parts.length > 1) {
                zip.file(filename, parts[1], {base64: true});
            }
        }
    });

    zip.generateAsync({type:"blob"})
    .then(function(content) {
        const link = document.createElement('a');
        const blobUrl = URL.createObjectURL(content);
        link.href = blobUrl;
        link.download = `thumbnails-${lastVideoId}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Revoke the object URL to avoid leaking memory on repeated downloads
        setTimeout(function() {
            URL.revokeObjectURL(blobUrl);
        }, 100);
    })
    .catch(function(err) {
        console.error('Error generating ZIP file:', err);
        alert('There was an error generating the ZIP file. Please try again.');
    });
}

// generate button
async function generate() {
    let output = document.getElementById('output');
    const url = document.getElementById('url-input').value.trim();
    const videoId = getYouTubeID(url);

    const fontInput = document.getElementById('font-select');
    if (fontInput) {
        applySelectedFont(fontInput.value);
    }

    if (!videoId) {
        alert('invalid youtube url');
        return;
    }

    // use shortUrl since Noembed doesn't support youtube.com/live URLs
    const api = 'https://noembed.com/embed?url=' + encodeURIComponent(shortUrl(videoId));

    try {
        const res = await fetch(api);
        const data = await res.json();
        process(data, videoId);
    } catch (err) {
        fatal(`error fetching video info: ${err}`);
    }
}

function process(data, videoId) {
    if (!data.title || !data.author_name || !data.url) {
        fatal('invalid video or missing data');
        return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = videoIdToThumbnail(videoId);

    img.onload = function onload() {
        lastVideoId = videoId;
        drawImages(img, data, videoId);

        // Show the dropdown instead of the old button
        const dropdown = document.getElementById('downloadDropdown');
        if (dropdown) dropdown.style.display = 'inline-block';
    };

    img.onerror = function onerror() {
        alert('failed loading high-res thumbnail');
    };
}

function base64img(name, canvas) {
    let data = canvas.toDataURL('image/jpeg');

    const a = document.createElement('a');
    a.download = name;
    a.href = data;

    const out = new Image();
    out.src = data;
    out.classList.add('generated');

    a.appendChild(out);

    return a;
}

function drawImages(img, data, videoId) {
    // clear any existing images
    let output = document.getElementById('output');
    output.innerHTML = '';

    console.log(data);

    // draw every image
    let funcs = [
        drawBasicImage,
        drawLargeImage,
        drawFullImage,
        drawBlurredImage,
    ];
    for (const func of funcs) {
        func(output, img, data, videoId);
    }
}

// -------- image drawing functions

function drawFullImage(output, img, data, videoId) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 1450;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 15;

    ctx.drawImage(img, 0, (1280 - 720) / 2, 1280, 720);

    // "Full Video on YouTube"
    const headline = 'Full Video on YouTube';

    // Dynamic font resizing:
    // For wide fonts (like Arial Black), the text "Full Video on YouTube" at 110px
    // can exceed the canvas width. We reduce the font size until it fits comfortably
    // within the canvas (with some margin).
    let fontSize = 110;
    ctx.font = resolveCanvasFont(fontSize);
    let textMetrics = ctx.measureText(headline);
    const padding = 50;
    // We want the total width (text + padding on both sides) to be less than canvas width - margin
    const maxContentWidth = canvas.width - 100;

    while ((textMetrics.width + padding * 2) > maxContentWidth && fontSize > 50) {
        fontSize -= 5;
        ctx.font = resolveCanvasFont(fontSize);
        textMetrics = ctx.measureText(headline);
    }

    // If we've reached the minimum font size and the text still doesn't fit,
    // log a warning so this edge case is visible during development/usage.
    if ((textMetrics.width + padding * 2) > maxContentWidth) {
        console.warn('Headline text does not fit within canvas even at minimum font size', {
            headline,
            fontSize,
            textWidth: textMetrics.width,
            maxContentWidth
        });
    }

    ctx.fillStyle = "#eee";
    ctx.textAlign = "center";
    const x = canvas.width / 2;
    const y = 170;
    ctx.fillText(headline, x, y);

    // draw the red oval around it
    const radiusX = textMetrics.width / 2 + padding;
    const radiusY = fontSize; // scale height relative to font size

    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.ellipse(x, y - 40, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // write the title
    ctx.textAlign = "left";
    ctx.fillStyle = "#eee";
    ctx.font = resolveCanvasFont(56);
    const lines = wrapText(ctx, data.title, 1240);
    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 1100 + i * 56);
    });

    // write the author name
    ctx.fillStyle = "#aaa";
    ctx.font = resolveCanvasFont(28);
    ctx.fillText(`YouTube: ${data.author_name}`, 20, 1100 + lines.length * 58 - 20);

    // write the url
    const urlText = shortUrl(videoId);
    ctx.fillStyle = "#fff";
    ctx.font = resolveCanvasFont(80);
    ctx.textAlign = "center";
    ctx.fillText(urlText, 1280 / 2, 1100 + lines.length * 58 + 110);

    let a = base64img(`${videoId}-full-image.jpg`, canvas);
    output.append(a);
}

function drawLargeImage(output, img, data, videoId) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, (1280 - 720) / 2, 1280, 720);

    // "Full Video on YouTube"
    const headline = 'Full Video on YouTube';

    // Dynamic font resizing:
    // Ensure the text fits on the canvas even with wide fonts.
    let fontSize = 110;
    ctx.font = resolveCanvasFont(fontSize);
    let textMetrics = ctx.measureText(headline);
    const padding = 50;
    const maxContentWidth = canvas.width - 100;

    while ((textMetrics.width + padding * 2) > maxContentWidth && fontSize > 50) {
        fontSize -= 5;
        ctx.font = resolveCanvasFont(fontSize);
        textMetrics = ctx.measureText(headline);
    }

    // If we've reached the minimum font size and the text still doesn't fit,
    // log a warning so this edge case is visible during development/usage.
    if ((textMetrics.width + padding * 2) > maxContentWidth) {
        console.warn('Headline text does not fit within canvas even at minimum font size', {
            headline,
            fontSize,
            textWidth: textMetrics.width,
            maxContentWidth
        });
    }

    ctx.fillStyle = "#eee";
    ctx.textAlign = "center";
    const x = canvas.width / 2;
    const y = 170;
    ctx.fillText(headline, x, y);

    // draw the red oval around it
    const radiusX = textMetrics.width / 2 + padding;
    const radiusY = fontSize; // scale height relative to font size

    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.ellipse(x, y - 40, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // write the title
    ctx.textAlign = "left";
    ctx.fillStyle = "#eee";
    ctx.font = resolveCanvasFont(56);
    const lines = wrapText(ctx, data.title, 1240);
    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 1100 + i * 56);
    });

    // write the author
    ctx.fillStyle = "#aaa";
    ctx.font = resolveCanvasFont(28);
    ctx.fillText(`YouTube: ${data.author_name}`, 20, 1100 + lines.length * 58 - 20);

    let a = base64img(`${videoId}-large-image.jpg`, canvas);
    output.append(a);
}

function drawBasicImage(output, img, data, videoId) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    let title = data.title;
    let author = data.author_name;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw the original thumbnail
    ctx.drawImage(img, 0, 0, 1280, 720);

    // write the title
    ctx.fillStyle = "#eee";
    ctx.font = resolveCanvasFont(56);
    let padding = 20;
    const lines = wrapText(ctx, title, 1280 - padding * 2);
    lines.forEach((line, i) => {
        ctx.fillText(line, padding, 780 + i * 56);
    });

    // write the author
    ctx.fillStyle = "#aaa";
    ctx.font = resolveCanvasFont(28);
    ctx.fillText(`YouTube: ${author}`, padding, 790 + lines.length * 58 - 20);

    let a = base64img(`${videoId}-basic-image.jpg`, canvas);
    output.append(a);
}

function drawBlurredImage(output, img, data, videoId) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    ctx.fillRect(0, 0, 1280, 720);

    // try to blur the thumbnail (may not work on all browsers sadly)
    ctx.filter = "blur(10px)";
    ctx.drawImage(img, 0, 0, 1280, 720);
    ctx.filter = "none"; // reset

    // overlay some dark color to darken the thumbnail
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, 1280, 720);

    // draw the centered URL text
    const urlText = shortUrl(videoId);
    ctx.fillStyle = "#fff";
    ctx.font = resolveCanvasFont(80);
    ctx.textAlign = "center";
    ctx.fillText(urlText, 1280 / 2, 720 / 2);

    let a = base64img(`${videoId}-blurred-image.jpg`, canvas);
    output.append(a);
}
