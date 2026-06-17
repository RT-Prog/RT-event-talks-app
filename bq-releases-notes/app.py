import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Create request with a proper User-Agent
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        # Parse XML
        root = ET.fromstring(xml_data)
        
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title_elem = entry.find('atom:title', ns)
            title = title_elem.text.strip() if title_elem is not None else "Unknown Date"
            
            updated_elem = entry.find('atom:updated', ns)
            updated = updated_elem.text.strip() if updated_elem is not None else ""
            
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ""
            
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            link = link_elem.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
            
            # Split the content HTML into individual release note items by <h3> tags
            # The structure is usually: <h3>Category</h3>\n<p>description</p>
            parts = re.split(r'<h3>(.*?)</h3>', content_html)
            items = []
            
            if len(parts) > 1:
                # parts[0] is everything before the first <h3> (usually empty or whitespace)
                for i in range(1, len(parts), 2):
                    item_type = parts[i].strip()
                    item_content_raw = parts[i+1].strip() if i+1 < len(parts) else ""
                    
                    # Convert raw content into clean text for tweets
                    # Remove HTML tags
                    clean_text = re.sub(r'<[^>]+>', '', item_content_raw)
                    # Collapse multiple spaces/newlines
                    clean_text = ' '.join(clean_text.split())
                    
                    items.append({
                        'type': item_type,
                        'content_html': item_content_raw,
                        'content_text': clean_text
                    })
            else:
                # Fallback if no <h3> tag was found
                clean_text = re.sub(r'<[^>]+>', '', content_html)
                clean_text = ' '.join(clean_text.split())
                items.append({
                    'type': 'Update',
                    'content_html': content_html,
                    'content_text': clean_text
                })
            
            entries.append({
                'date': title,
                'updated': updated,
                'link': link,
                'items': items
            })
            
        return entries, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    entries, error = fetch_and_parse_feed()
    if error:
        return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'data': entries})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
