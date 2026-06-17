// Frontend logic for BigQuery Release Notes Tracker

document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let allReleases = [];
    let filteredReleases = [];
    let selectedNote = null;
    let activeCategory = 'All';
    let searchQuery = '';

    // DOM Elements
    const timelineEl = document.getElementById('timeline');
    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const errorMessageEl = document.getElementById('error-message');
    const emptyStateEl = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const filterChips = document.querySelectorAll('.filter-chip');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // Tweet Composer Elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextArea = document.getElementById('tweet-text-area');
    const tweetCharCount = document.getElementById('tweet-char-count');
    const btnSendTweet = document.getElementById('btn-send-tweet');
    const btnCloseComposer = document.getElementById('btn-close-composer');

    // Init
    // Restore saved theme from local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    fetchReleases();

    // Event Listeners
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            if (document.body.classList.contains('light-mode')) {
                localStorage.setItem('theme', 'light');
            } else {
                localStorage.setItem('theme', 'dark');
            }
        });
    }
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        applyFilters();
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.dataset.category;
            applyFilters();
        });
    });

    // Tweet modal text change listener
    tweetTextArea.addEventListener('input', () => {
        updateCharCount();
    });

    btnCloseComposer.addEventListener('click', closeTweetComposer);

    btnSendTweet.addEventListener('click', () => {
        const text = tweetTextArea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    });

    // Fetch Release Notes
    async function fetchReleases(isRefresh = false) {
        showLoadingState();
        if (isRefresh) {
            refreshIcon.classList.add('spinner');
            refreshBtn.disabled = true;
        }

        try {
            const response = await fetch('/api/releases');
            const result = await response.json();

            if (result.success) {
                allReleases = result.data;
                applyFilters();
                hideStates();
            } else {
                showErrorState(result.error || 'Failed to fetch release notes.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showErrorState('Network error: Could not reach the server.');
        } finally {
            if (isRefresh) {
                refreshIcon.classList.remove('spinner');
                refreshBtn.disabled = false;
            }
        }
    }

    // Apply Filters & Search
    function applyFilters() {
        filteredReleases = [];

        allReleases.forEach(entry => {
            // Filter individual items within the entry
            const matchingItems = entry.items.filter(item => {
                const matchesCategory = (activeCategory === 'All' || item.type.toLowerCase() === activeCategory.toLowerCase());
                const matchesSearch = (
                    item.content_text.toLowerCase().includes(searchQuery) ||
                    item.type.toLowerCase().includes(searchQuery) ||
                    entry.date.toLowerCase().includes(searchQuery)
                );
                return matchesCategory && matchesSearch;
            });

            if (matchingItems.length > 0) {
                filteredReleases.push({
                    ...entry,
                    items: matchingItems
                });
            }
        });

        renderReleases();
    }

    // Render Timeline
    function renderReleases() {
        timelineEl.innerHTML = '';

        if (filteredReleases.length === 0) {
            showEmptyState();
            return;
        }

        hideStates();

        filteredReleases.forEach(entry => {
            const groupEl = document.createElement('div');
            groupEl.className = 'timeline-group';

            // Create Group Header
            const headerEl = document.createElement('div');
            headerEl.className = 'timeline-header';
            
            // Format icon or dot
            headerEl.innerHTML = `
                <div class="timeline-dot">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <div class="timeline-date">${entry.date}</div>
            `;
            groupEl.appendChild(headerEl);

            // Create Items Grid
            const itemsEl = document.createElement('div');
            itemsEl.className = 'timeline-items';

            entry.items.forEach(item => {
                const cardEl = document.createElement('div');
                cardEl.className = 'note-card';
                
                // Set custom color variable based on category
                const catLower = item.type.toLowerCase();
                let badgeClass = 'badge-update';
                let customColor = 'var(--color-update)';
                
                if (catLower.includes('feature')) {
                    badgeClass = 'badge-feature';
                    customColor = 'var(--color-feature)';
                } else if (catLower.includes('change')) {
                    badgeClass = 'badge-change';
                    customColor = 'var(--color-change)';
                } else if (catLower.includes('breaking')) {
                    badgeClass = 'badge-breaking';
                    customColor = 'var(--color-breaking)';
                } else if (catLower.includes('issue')) {
                    badgeClass = 'badge-issue';
                    customColor = 'var(--color-issue)';
                } else if (catLower.includes('announcement')) {
                    badgeClass = 'badge-announcement';
                    customColor = 'var(--color-announcement)';
                }

                cardEl.style.setProperty('--badge-color', customColor);

                // Add active selected state class
                if (selectedNote && selectedNote.id === `${entry.date}-${item.content_text.substring(0,20)}`) {
                    cardEl.classList.add('selected');
                }

                cardEl.innerHTML = `
                    <div class="card-header">
                        <div class="badge-wrapper">
                            <span class="category-badge ${badgeClass}">
                                <span class="pulse-dot" style="background-color: ${customColor}"></span>
                                ${item.type}
                            </span>
                        </div>
                        <div class="card-actions">
                            <button class="btn-icon-copy" title="Copy to clipboard">
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon-share" title="Tweet this update" data-date="${entry.date}" data-type="${item.type}" data-link="${entry.link}">
                                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        ${item.content_html}
                    </div>
                `;

                // Add Click to Select Card Handler
                cardEl.addEventListener('click', (e) => {
                    // Prevent trigger if clicking the share or copy icons or links inside
                    if (e.target.closest('.btn-icon-share') || e.target.closest('.btn-icon-copy') || e.target.closest('a')) {
                        return;
                    }
                    
                    // Toggle selection
                    const noteId = `${entry.date}-${item.content_text.substring(0,20)}`;
                    document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));

                    if (selectedNote && selectedNote.id === noteId) {
                        selectedNote = null;
                        closeTweetComposer();
                    } else {
                        selectedNote = {
                            id: noteId,
                            date: entry.date,
                            type: item.type,
                            text: item.content_text,
                            link: entry.link
                        };
                        cardEl.classList.add('selected');
                        openTweetComposer(selectedNote);
                    }
                });

                // Add direct tweet button click handler
                cardEl.querySelector('.btn-icon-share').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const shareBtn = e.currentTarget;
                    const noteData = {
                        date: shareBtn.getAttribute('data-date'),
                        type: shareBtn.getAttribute('data-type'),
                        text: item.content_text,
                        link: shareBtn.getAttribute('data-link')
                    };
                    
                    // Highlight the card
                    document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));
                    cardEl.classList.add('selected');
                    selectedNote = {
                        id: `${noteData.date}-${noteData.text.substring(0,20)}`,
                        ...noteData
                    };
                    
                    openTweetComposer(selectedNote);
                });

                // Add copy to clipboard click handler
                cardEl.querySelector('.btn-icon-copy').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const copyBtn = e.currentTarget;
                    const textToCopy = item.content_text;
                    
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        copyBtn.classList.add('copied');
                        const originalHTML = copyBtn.innerHTML;
                        
                        // Show checkmark
                        copyBtn.innerHTML = `
                            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                            </svg>
                        `;
                        copyBtn.title = "Copied!";
                        
                        setTimeout(() => {
                            copyBtn.classList.remove('copied');
                            copyBtn.innerHTML = originalHTML;
                            copyBtn.title = "Copy to clipboard";
                        }, 1500);
                    }).catch(err => {
                        console.error('Could not copy text: ', err);
                    });
                });

                itemsEl.appendChild(cardEl);
            });

            groupEl.appendChild(itemsEl);
            timelineEl.appendChild(groupEl);
        });
    }

    // Tweet Builder and Length manager
    function openTweetComposer(note) {
        const generatedTweet = composeTweet(note);
        tweetTextArea.value = generatedTweet;
        tweetModal.classList.add('active');
        updateCharCount();
    }

    function closeTweetComposer() {
        tweetModal.classList.remove('active');
        document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));
        selectedNote = null;
    }

    function composeTweet(note) {
        const prefix = `Google Cloud #BigQuery Update: [${note.type}] (${note.date}): `;
        const suffix = `\n\nRead more here: ${note.link}`;
        
        // Target length is 280 characters.
        const maxTweetLen = 280;
        const currentLengthWithoutText = prefix.length + suffix.length;
        const availableTextLen = maxTweetLen - currentLengthWithoutText;
        
        let bodyText = note.text;
        if (bodyText.length > availableTextLen) {
            // Need to truncate. Subtract 3 for '...'
            bodyText = bodyText.substring(0, availableTextLen - 3) + '...';
        }
        
        return `${prefix}${bodyText}${suffix}`;
    }

    function updateCharCount() {
        const currentLength = tweetTextArea.value.length;
        const remaining = 280 - currentLength;
        tweetCharCount.textContent = `${remaining} chars left`;
        
        // Stylings based on limits
        tweetCharCount.className = 'tweet-char-count';
        if (remaining <= 20 && remaining >= 0) {
            tweetCharCount.classList.add('warning');
        } else if (remaining < 0) {
            tweetCharCount.classList.add('error');
        }

        // Enable/Disable Tweet Button
        if (currentLength === 0 || remaining < 0) {
            btnSendTweet.disabled = true;
        } else {
            btnSendTweet.disabled = false;
        }
    }

    // UI States
    function showLoadingState() {
        timelineEl.style.display = 'none';
        loadingStateEl.style.display = 'block';
        errorStateEl.style.display = 'none';
        emptyStateEl.style.display = 'none';
    }

    function hideStates() {
        timelineEl.style.display = 'block';
        loadingStateEl.style.display = 'none';
        errorStateEl.style.display = 'none';
        emptyStateEl.style.display = 'none';
    }

    function showErrorState(message) {
        timelineEl.style.display = 'none';
        loadingStateEl.style.display = 'none';
        errorStateEl.style.display = 'block';
        emptyStateEl.style.display = 'none';
        errorMessageEl.textContent = message;
    }

    function showEmptyState() {
        timelineEl.style.display = 'none';
        loadingStateEl.style.display = 'none';
        errorStateEl.style.display = 'none';
        emptyStateEl.style.display = 'block';
    }

    // Export current filtered releases to CSV file
    function exportToCSV() {
        if (filteredReleases.length === 0) {
            alert('No release notes to export.');
            return;
        }

        let csvRows = [];
        // CSV Headers
        csvRows.push(["Date", "Category", "Link", "Description"].map(h => `"${h.replace(/"/g, '""')}"`).join(","));

        filteredReleases.forEach(entry => {
            entry.items.forEach(item => {
                const row = [
                    entry.date,
                    item.type,
                    entry.link,
                    item.content_text
                ].map(val => `"${val.replace(/"/g, '""')}"`);
                csvRows.push(row.join(","));
            });
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const dateStr = new Date().toISOString().slice(0, 10);
        const catStr = activeCategory.toLowerCase();
        link.setAttribute("download", `bigquery_releases_${catStr}_${dateStr}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});
