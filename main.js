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
 * - Harry Skerritt <contact@harryskerritt.co.uk>
 */

let lastVideoId = null;
let font = 'Arial';

// Google font picker
const fontInput = document.getElementById('font-input');

async function setupFontPicker() {
    try {
        const resp = await fetch('https://raw.githubusercontent.com/jonathantneal/google-fonts-complete/refs/heads/master/google-fonts.json');
        const fonts = await resp.json();
        const fontNames = Object.keys(fonts);

        // Sort names alphabetically
        fontNames.sort();

        fontInput.innerHTML = '';

        // Add a default Arial option first
        const defaultOpt = document.createElement('option');
        defaultOpt.value = 'Arial';
        defaultOpt.textContent = 'Arial (Default)';
        fontInput.appendChild(defaultOpt);

        // Populate with Google Fonts
        fontNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            fontInput.appendChild(option);
        });

        console.log(`Loaded ${fontNames.length} fonts into dropdown.`);
    } catch (err) {
        console.error("Could not load Google Fonts list", err);
        fontInput.innerHTML = '<option value="Arial">Error loading fonts</option>';
    }
}

setupFontPicker();

async function syncFont() {
    const selectedFont = fontInput.value;
    if (!selectedFont || selectedFont === 'Arial') {
        font = 'Arial';
        return;
    }

    const linkId = 'dynamic-google-font';
    let link = document.getElementById(linkId);
    if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    link.href = `https://fonts.googleapis.com/css?family=${selectedFont.replace(/ /g, '+')}&display=swap`;

    try {
        // Wait for the font to be loaded in the browser
        await document.fonts.load(`1em "${selectedFont}"`);

        await new Promise(resolve => setTimeout(resolve, 50));
        font = selectedFont;
        console.log(`Font "${selectedFont}" is ready.`);
    } catch (e) {
        console.warn('Font failed to load', e);
        font = 'Arial';
    }
}


// allow user to press enter
let urlInput = document.getElementById('url-input');
urlInput.addEventListener('keypress', function onevent(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        generate();
    }
});

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
        return parsed.pathname.slice(1);
    }
    if (parsed.hostname.includes('youtube.com')) {
        return parsed.searchParams.get('v');
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
        }, i * 100);
    });
}

// generate button
async function generate() {
    await syncFont();

    let output = document.getElementById('output');
    const url = document.getElementById('url-input').value.trim();
    const videoId = getYouTubeID(url);

    if (!videoId) {
        alert('invalid youtube url');
        return;
    }



    const api = 'https://noembed.com/embed?url=' + encodeURIComponent(url);

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

    img.onload = async function onload() {
        lastVideoId = videoId;

        await syncFont();

        drawImages(img, data, videoId);

        document.getElementById('downloadBtn').style.display = 'inline-block';
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
    for (func of funcs) {
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
    ctx.font = `110px "${font}", sans-serif`;
    ctx.fillStyle = "#eee";
    ctx.textAlign = "center";
    const x = canvas.width / 2;
    const y = 170;
    ctx.fillText(headline, x, y);

    // draw the red oval around it
    const textMetrics = ctx.measureText(headline);
    const padding = 50;
    const radiusX = textMetrics.width / 2 + padding;
    const radiusY = 110;

    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.ellipse(x, y - 40, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // write the title
    ctx.textAlign = "left";
    ctx.fillStyle = "#eee";
    ctx.font = `56px "${font}", sans-serif`;
    const lines = wrapText(ctx, data.title, 1240);
    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 1100 + i * 56);
    });

    // write the author name
    ctx.fillStyle = "#aaa";
    ctx.font = `28px "${font}", sans-serif`;
    ctx.fillText(`YouTube: ${data.author_name}`, 20, 1100 + lines.length * 58 - 20);

    // write the url
    const urlText = shortUrl(videoId);
    ctx.fillStyle = "#fff";
    ctx.font = `80px "${font}", sans-serif`;
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
    ctx.font = `110px "${font}", sans-serif`;
    ctx.fillStyle = "#eee";
    ctx.textAlign = "center";
    const x = canvas.width / 2;
    const y = 170;
    ctx.fillText(headline, x, y);

    // draw the red oval around it
    const textMetrics = ctx.measureText(headline);
    const padding = 50;
    const radiusX = textMetrics.width / 2 + padding;
    const radiusY = 110; // height of text + some padding

    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.ellipse(x, y - 40, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // write the title
    ctx.textAlign = "left";
    ctx.fillStyle = "#eee";
    ctx.font = `56px "${font}", sans-serif`;
    const lines = wrapText(ctx, data.title, 1240);
    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 1100 + i * 56);
    });

    // write the author
    ctx.fillStyle = "#aaa";
    ctx.font = `28px "${font}", sans-serif`;
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
    ctx.font = `56px "${font}", sans-serif`;
    let padding = 20;
    const lines = wrapText(ctx, title, 1280 - padding * 2);
    lines.forEach((line, i) => {
        ctx.fillText(line, padding, 780 + i * 56);
    });

    // write the author
    ctx.fillStyle = "#aaa";
    ctx.font = `28px "${font}", sans-serif`;
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
    ctx.font = `80px "${font}", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(urlText, 1280 / 2, 720 / 2);

    let a = base64img(`${videoId}-blurred-image.jpg`, canvas);
    output.append(a);
}
