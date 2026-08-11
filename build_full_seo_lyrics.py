import urllib.request
import json
import re
import html
import time

print("Fetching lyrics from Firestore for SEO pre-rendering...")

base_url = "https://firestore.googleapis.com/v1/projects/saikhamakawnktp-67519/databases/(default)/documents/lyrics?pageSize=100"
docs = []
page_token = None

for attempt in range(10):
    try:
        url = base_url
        if page_token:
            url += f"&pageToken={page_token}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            batch = data.get('documents', [])
            docs.extend(batch)
            print(f"Fetched {len(batch)} documents (Total so far: {len(docs)})")
            page_token = data.get('nextPageToken')
            if not page_token:
                break
        time.sleep(2) # avoid 429
    except Exception as e:
        print(f"Attempt {attempt+1} error: {e}")
        time.sleep(5)

print(f"Total songs fetched: {len(docs)}")

songs = []
for doc in docs:
    fields = doc.get('fields', {})
    title = fields.get('title', {}).get('stringValue', '')
    lyrics = fields.get('lyrics', {}).get('stringValue', '')
    composer = fields.get('composer', {}).get('stringValue', '')
    
    if title:
        clean_title = ' '.join(title.split())
        doc_id = doc.get('name', '').split('/')[-1]
        slug = re.sub(r'[^\w\s-]', '', clean_title.lower())
        slug = re.sub(r'[\s_-]+', '-', slug).strip('-')
        songs.append({
            'id': doc_id,
            'title': clean_title,
            'slug': slug,
            'lyrics': lyrics,
            'composer': composer
        })

songs.sort(key=lambda s: s['title'].lower())

schema_items = []
html_items = []

for i, s in enumerate(songs, 1):
    schema_items.append({
        "@type": "ListItem",
        "position": i,
        "item": {
            "@type": "MusicComposition",
            "name": s['title'],
            "composer": s['composer'] if s['composer'] else "Unknown",
            "url": f"https://saikhamakawnktp.org/hla-lyrics?song={s['slug']}"
        }
    })
    
    escaped_title = html.escape(s['title'])
    escaped_composer = html.escape(s['composer']) if s['composer'] else ''
    escaped_lyrics = html.escape(s['lyrics'][:200]) if s['lyrics'] else ''
    
    html_items.append(
        f'<article class="seo-song-item" style="margin-bottom:1rem;">'
        f'<h3><a href="https://saikhamakawnktp.org/hla-lyrics?song={s["slug"]}">{escaped_title} Lyrics</a></h3>'
        f'{f"<p><strong>Composer:</strong> {escaped_composer}</p>" if escaped_composer else ""}'
        f'{f"<p>{escaped_lyrics}...</p>" if escaped_lyrics else ""}'
        f'</article>'
    )

schema_json = json.dumps({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "KṬP Saikhamakawn Mizo Hla Lyrics Collection",
    "description": "Full collection of Mizo Christian Hla Lyrics & Choir Songs",
    "numberOfItems": len(songs),
    "itemListElement": schema_items
}, indent=2, ensure_ascii=False)

seo_block = f"""
  <!-- SEO Pre-rendered Song Catalog for Google Indexing -->
  <script type="application/ld+json" id="seo-songs-schema">
{schema_json}
  </script>

  <!-- Crawlable Static Song Catalog for Googlebot -->
  <noscript>
    <section class="seo-static-lyrics-catalog">
      <h2>Mizo Hla Lyrics Directory</h2>
      {"".join(html_items)}
    </section>
  </noscript>
"""

with open('hla-lyrics.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\s*<!-- SEO Pre-rendered Song Catalog.*?((</noscript>)|(</div>))', '', content, flags=re.DOTALL)

if '</head>' in content:
    content = content.replace('</head>', f'{seo_block}\n</head>')

with open('hla-lyrics.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated hla-lyrics.html successfully!")
