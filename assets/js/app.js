/* ============================================
   Daily Special - Main JavaScript
   ============================================ */

(function () {
    'use strict';

    /* ------------------------------------------
       Configuration
       ------------------------------------------
       To connect a Google Sheet:
       1. Create a Google Sheet with tabs named: About, Videos, Members
       2. Publish it: File > Share > Publish to web (entire document, as Web page)
       3. Copy the sheet ID from the URL (the long string between /d/ and /edit)
       4. Paste it below as SHEET_ID
       ------------------------------------------ */
    const CONFIG = {
        SHEET_ID: '16UjgC9UI0J6k1y3RkX5bdXjiWJCR8roP038sEZ6Un9Q', // Paste your Google Sheet ID here
        // Tab names in your Google Sheet (must match exactly)
        TABS: {
            ABOUT: 'About',
            VIDEOS: 'Videos',
            MEMBERS: 'Members'
        }
    };

    /* ------------------------------------------
       Navigation
       ------------------------------------------ */
    function initNav() {
        const nav = document.getElementById('nav');
        const toggle = document.querySelector('.nav-toggle');
        const links = document.querySelector('.nav-links');
        const navAnchors = document.querySelectorAll('.nav-links a');

        // Scroll effect
        function handleScroll() {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Mobile toggle
        toggle.addEventListener('click', function () {
            toggle.classList.toggle('active');
            links.classList.toggle('open');
        });

        // Close mobile nav on link click
        navAnchors.forEach(function (anchor) {
            anchor.addEventListener('click', function () {
                toggle.classList.remove('active');
                links.classList.remove('open');
            });
        });

        // Active section highlighting
        const sections = document.querySelectorAll('section[id]');
        function highlightNav() {
            var scrollPos = window.scrollY + 120;
            sections.forEach(function (section) {
                var top = section.offsetTop;
                var height = section.offsetHeight;
                var id = section.getAttribute('id');
                var link = document.querySelector('.nav-links a[href="#' + id + '"]');
                if (link) {
                    if (scrollPos >= top && scrollPos < top + height) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                }
            });
        }
        window.addEventListener('scroll', highlightNav, { passive: true });
    }

    /* ------------------------------------------
       Footer Year
       ------------------------------------------ */
    function initFooterYear() {
        var yearEl = document.getElementById('year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    /* ------------------------------------------
       Contact Form
       ------------------------------------------ */
    function initContactForm() {
        var form = document.getElementById('contact-form');
        var status = document.getElementById('form-status');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var formAction = form.getAttribute('action');
            // If Formspree isn't configured, fall back to mailto
            if (!formAction || formAction.indexOf('YOUR_FORM_ID') !== -1) {
                var name = form.querySelector('#name').value;
                var email = form.querySelector('#email').value;
                var eventType = form.querySelector('#event-type').value;
                var eventDate = form.querySelector('#event-date').value;
                var message = form.querySelector('#message').value;

                var subject = 'Booking Inquiry from ' + name;
                var body = 'Name: ' + name + '\n'
                    + 'Email: ' + email + '\n'
                    + 'Event Type: ' + eventType + '\n'
                    + 'Event Date: ' + eventDate + '\n\n'
                    + message;

                window.location.href = 'mailto:dailyspecialquartet@gmail.com'
                    + '?subject=' + encodeURIComponent(subject)
                    + '&body=' + encodeURIComponent(body);
                return;
            }

            // Submit via Formspree
            var data = new FormData(form);
            fetch(formAction, {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' }
            }).then(function (response) {
                if (response.ok) {
                    status.textContent = 'Thanks! We\'ll get back to you soon.';
                    status.className = 'form-status success';
                    form.reset();
                } else {
                    throw new Error('Form submission failed');
                }
            }).catch(function () {
                status.textContent = 'Oops! Something went wrong. Please email us directly.';
                status.className = 'form-status error';
            });
        });
    }

    /* ------------------------------------------
       Google Sheets Integration
       ------------------------------------------ */

    /**
     * Fetches data from a published Google Sheet tab using JSONP.
     * This avoids CORS issues since the Google Visualization API response
     * is designed to be loaded as a script with a callback.
     * The sheet must be published to the web (File > Share > Publish to web).
     */
    var jsonpCounter = 0;
    function fetchSheetData(sheetId, tabName) {
        return new Promise(function (resolve, reject) {
            var callbackName = '_sheetCallback' + (jsonpCounter++);
            var timeout = setTimeout(function () {
                delete window[callbackName];
                script.remove();
                reject(new Error('Sheet request timed out for tab: ' + tabName));
            }, 10000);

            window[callbackName] = function (data) {
                clearTimeout(timeout);
                delete window[callbackName];
                script.remove();
                try {
                    resolve(parseSheetData(data));
                } catch (e) {
                    reject(e);
                }
            };

            var url = 'https://docs.google.com/spreadsheets/d/' + sheetId
                + '/gviz/tq?tqx=responseHandler:' + callbackName
                + '&sheet=' + encodeURIComponent(tabName);

            var script = document.createElement('script');
            script.src = url;
            script.onerror = function () {
                clearTimeout(timeout);
                delete window[callbackName];
                script.remove();
                reject(new Error('Failed to load sheet data for tab: ' + tabName));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Parses the Google Visualization API response into an array of objects.
     * First row is treated as headers.
     */
    function parseSheetData(data) {
        if (data.status === 'error') {
            var msg = (data.errors && data.errors[0] && data.errors[0].detailed_message) || 'Unknown sheet error';
            throw new Error(msg);
        }

        var table = data.table;
        if (!table || !table.cols || !table.rows) {
            throw new Error('Sheet tab is empty or missing');
        }

        var headers = table.cols.map(function (col) { return col.label || ''; });

        // If all headers are empty, the first data row might be the headers
        var allEmpty = headers.every(function (h) { return !h; });
        var startRow = 0;
        if (allEmpty && table.rows.length > 0) {
            table.rows[0].c.forEach(function (cell, i) {
                headers[i] = cell ? String(cell.v || '') : '';
            });
            startRow = 1;
        }

        var rows = [];
        for (var r = startRow; r < table.rows.length; r++) {
            var row = table.rows[r];
            if (!row || !row.c) continue;
            var obj = {};
            var hasData = false;
            row.c.forEach(function (cell, i) {
                var header = headers[i] || ('col' + i);
                var val = cell ? (cell.v != null ? String(cell.v) : '') : '';
                obj[header.toLowerCase().trim()] = val;
                if (val) hasData = true;
            });
            if (hasData) rows.push(obj);
        }

        return rows;
    }

    /**
     * Updates the About section with data from the sheet.
     * Expected columns: content
     */
    function updateAbout(rows) {
        var container = document.getElementById('about-text');
        if (!container || !rows.length) return;

        var html = '';
        rows.forEach(function (row) {
            var content = row.content || row.text || '';
            if (content) {
                html += '<p>' + content + '</p>';
            }
        });

        if (html) {
            container.innerHTML = html;
        }
    }

    /**
     * Updates the Videos section with data from the sheet.
     * Expected columns: title, youtube_url (or url), description
     */
    function updateVideos(rows) {
        var container = document.getElementById('videos-grid');
        if (!container || !rows.length) return;

        var html = '';
        rows.forEach(function (row) {
            var title = row.title || '';
            var url = row.youtube_url || row.url || '';
            var description = row.description || '';

            if (!url) return;

            // Extract YouTube video ID and build embed URL
            var videoId = extractYouTubeId(url);
            if (!videoId) return;

            var embedUrl = 'https://www.youtube-nocookie.com/embed/' + videoId;

            html += '<div class="video-card">'
                + '<div class="video-embed">'
                + '<iframe src="' + embedUrl + '" title="' + escapeHtml(title)
                + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>'
                + '</div>'
                + '<h3>' + escapeHtml(title) + '</h3>'
                + '<p>' + escapeHtml(description) + '</p>'
                + '</div>';
        });

        if (html) {
            container.innerHTML = html;
        }
    }

    /**
     * Updates the Members section with data from the sheet.
     * Expected columns: name, part, bio
     * Photos are NOT pulled from the sheet — they stay as set in index.html.
     * The sheet rows are matched to existing cards by position (order must match).
     */
    function updateMembers(rows) {
        var container = document.getElementById('members-grid');
        if (!container || !rows.length) return;

        var cards = container.querySelectorAll('.member-card');

        rows.forEach(function (row, i) {
            var card = cards[i];
            if (!card) return;

            var name = row.name || '';
            var part = row.part || '';
            var bio = row.bio || '';

            if (name) card.querySelector('h3').textContent = name;
            if (part) card.querySelector('.member-part').textContent = part;
            if (bio)  card.querySelector('.member-bio').textContent = bio;
            // Photo intentionally left untouched — set in HTML
        });
    }

    /**
     * Extracts a YouTube video ID from various URL formats.
     */
    function extractYouTubeId(url) {
        var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    /**
     * Simple HTML escaping.
     */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Loads all content from the Google Sheet.
     * Only runs if SHEET_ID is configured.
     */
    function loadSheetContent() {
        if (!CONFIG.SHEET_ID) {
            console.log('Google Sheet not configured. Using default content. Set CONFIG.SHEET_ID in app.js to enable dynamic content.');
            return;
        }

        // Load each tab - failures are non-fatal, the page keeps its default HTML content
        fetchSheetData(CONFIG.SHEET_ID, CONFIG.TABS.ABOUT)
            .then(updateAbout)
            .catch(function (err) { console.warn('[Sheets] About tab:', err.message, '- using default content'); });

        fetchSheetData(CONFIG.SHEET_ID, CONFIG.TABS.VIDEOS)
            .then(updateVideos)
            .catch(function (err) { console.warn('[Sheets] Videos tab:', err.message, '- using default content'); });

        fetchSheetData(CONFIG.SHEET_ID, CONFIG.TABS.MEMBERS)
            .then(updateMembers)
            .catch(function (err) { console.warn('[Sheets] Members tab:', err.message, '- using default content'); });
    }

    /* ------------------------------------------
       Initialize
       ------------------------------------------ */
    document.addEventListener('DOMContentLoaded', function () {
        initNav();
        initFooterYear();
        initContactForm();
        loadSheetContent();
    });

})();
