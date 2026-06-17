# BigQuery Release Notes Tracker & Tweet Composer

A modern, responsive web application built with **Python Flask** and **Vanilla HTML/CSS/JS** that fetches, organizes, and processes Google Cloud BigQuery release notes. It parses update items individually and includes a custom **Tweet Composer** that automates formatting and character limits for sharing updates to Twitter.

---

## 🚀 Features

*   **Live Feed Synchronization:** Automatically pulls the latest release updates from the Google Cloud BigQuery Atom feed.
*   **Granular Parser:** Splits complex daily summaries into isolated cards representing individual updates (e.g. Features, Changes, Issues, Announcements).
*   **Interactive Search & Filters:** Fast, client-side keyword search and filter chips to quickly find specific types of updates.
*   **Tweet Composer Modal:** Displays an overlay composer when selecting an update. It calculates remaining characters out of 280, automatically truncates descriptions to fit, and redirects to a Twitter Web Intent.
*   **Dark Mode Glassmorphic UI:** Features clean styling, hover animations, category color coding, and loading skeleton states.

---

## 📁 Directory Structure

```text
├── README.md                  # Project overview and instructions
├── .gitignore                 # Excluded environments and cache
├── bq-releases-notes/         # Main application directory
│   ├── app.py                 # Flask server & feed parsing engine
│   ├── templates/
│   │   └── index.html         # Frontend HTML structure
│   └── static/
│       ├── css/
│       │   └── style.css      # Dark-mode responsive styling
│       └── js/
│           └── main.js        # Dynamic filtering, rendering, & tweeting logic
```

---

## 🛠️ Setup & Installation

### Prerequisites
*   Python 3.7+
*   Flask (`pip install flask`)

### 1. Run Locally
Navigate to the application folder and start the Flask web server:

```bash
cd bq-releases-notes
python3 app.py
```

### 2. Access the Application
Open your web browser and navigate to:
[**http://127.0.0.1:5001**](http://127.0.0.1:5001)

---

## 🔄 Architecture & Data Flow

```mermaid
graph LR
    A[GCP Atom XML Feed] -->|Fetch & Parse| B(Flask API Route)
    B -->|Clean HTML to JSON| C[JS Controller]
    C -->|Render Timeline & Filter| D[Dashboard UI]
    D -->|Click Card & Share| E[Tweet Intent]
```

1.  The client initiates an asynchronous request to `/api/releases`.
2.  The Flask server fetches the raw feed from GCP, parses elements using `xml.etree.ElementTree`, splits item blocks using custom regex, cleans tags, and returns JSON.
3.  The Javascript controller handles searching and category filtering in-memory, updating card containers on the fly.
4.  Selecting a card opens the Tweet modal, where the character constraint engine handles safe formatting.
