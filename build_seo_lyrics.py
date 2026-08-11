import urllib.request
import json
import re
import html

# 1. Fetch ALL songs from Firestore REST API with pagination
base_url = "https://firestore.googleapis.com/v1/projects/saikhamakawnktp-67519/databases/(default)/documents/lyrics?pageSize=300"

docs = []
page_token = None

while True:
    url = base_url
    if page_token:
        url += f"&pageToken={page_token}"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            batch = data.get('documents', [])
            docs.extend(batch)
            page_token = data.get('nextPageToken')
            if not page_token:
                break
    except Exception as e:
        print("Error fetching from Firestore:", e)
        break

print(f"Total songs fetched from Firestore: {len(docs)}")

songs = []
for doc in docs:
    fields = doc.get('fields', {})
    title = fields.get('title', {}).get('stringValue', '')
    if title:
        clean_title = ' '.join(title.split())
        doc_id = doc.get('name', '').split('/')[-1]
        slug = re.sub(r'[^\w\s-]', '', clean_title.lower())
        slug = re.sub(r'[\s_-]+', '-', slug).strip('-')
        songs.append({
            'id': doc_id,
            'title': clean_title,
            'slug': slug
        })

# Sort songs alphabetically by title
songs.sort(key=lambda s: s['title'].lower())

# Generate Schema.org JSON-LD structured data for Googlebot
schema_items = []
for i, s in enumerate(songs, 1):
    schema_items.append({
        "@type": "ListItem",
        "position": i,
        "name": s['title'],
        "url": f"https://saikhamakawnktp.org/hla-lyrics?song={s['slug']}"
    })

schema_json = json.dumps({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "KṬP Saikhamakawn Mizo Hla Lyrics Collection",
    "description": "Full collection of Mizo Christian Hla Lyrics & Choir Songs",
    "numberOfItems": len(songs),
    "itemListElement": schema_items
}, indent=2, ensure_ascii=False)

# Generate static SEO HTML fallback list for Googlebot
seo_html_items = []
for s in songs:
    escaped_title = html.escape(s['title'])
    seo_html_items.append(
        f'<li><a href="https://saikhamakawnktp.org/hla-lyrics?song={s["slug"]}">{escaped_title} Lyrics</a></li>'
    )

seo_html_block = f"""
  <!-- SEO Pre-rendered Song Catalog for Google Indexing -->
  <script type="application/ld+json" id="seo-songs-schema">
{schema_json}
  </script>

  <!-- Static HTML Song List for Search Engine Crawlers -->
  <div id="seo-static-lyrics-catalog" style="display: none;" aria-hidden="true">
    <h2>Mizo Hla Lyrics Index</h2>
    <ul>
      {"".join(seo_html_items)}
    </ul>
  </div>
"""

# Update hla-lyrics.html
with open('hla-lyrics.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Remove existing SEO block if present
html_content = re.sub(r'\s*<!-- SEO Pre-rendered Song Catalog.*?</div>', '', html_content, flags=re.DOTALL)

# Insert before </head>
if '</head>' in html_content:
    new_html = html_content.replace('</head>', f'{seo_html_block}\n</head>')
    with open('hla-lyrics.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("Successfully updated hla-lyrics.html with ALL song titles and Schema.org data!")
