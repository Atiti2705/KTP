import os
import re

files_to_fix = [
    ('assets/js/sermons.js', 'No Sermons Found', "DbService.get('sermons')"),
    ('assets/js/lyrics.js', 'No Lyrics Found', "DbService.get('lyrics')"),
    ('assets/js/documents.js', 'No Documents Found', "DbService.get("),
    ('assets/js/gallery.js', 'No Photos Found', "DbService.get('photos')"),
    ('assets/js/golden-jubilee.js', 'No Folders Found', "DbService.get("),
    ('assets/js/golden-jubilee.js', 'No Items Match Search', "DbService.get("),
    ('assets/js/branch-chanchin.js', 'No BranchChanchin Found', "DbService.get('branch-chanchin')")
]

for file, empty_text, fetch_code in files_to_fix:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'let dataLoaded =' in content:
        continue # Already fixed
        
    # 1. Add dataLoaded = false
    content = content.replace("document.addEventListener('DOMContentLoaded',", "let dataLoaded = false;\n\ndocument.addEventListener('DOMContentLoaded',", 1)
    
    # 2. Set dataLoaded = true in the fetch promise
    content = content.replace(fetch_code + ".then(data => {", fetch_code + ".then(data => {\n    dataLoaded = true;")
    content = content.replace(fetch_code + ".then(items => {", fetch_code + ".then(items => {\n    dataLoaded = true;")
    content = content.replace(fetch_code + "collectionName).then(items => {", fetch_code + "collectionName).then(items => {\n    dataLoaded = true;")
    
    # Let's also catch the error case
    content = content.replace(".catch(err =>", ".catch(err => { dataLoaded = true;")
    content = content.replace(".catch(error =>", ".catch(error => { dataLoaded = true;")

    # 3. Fix the empty state
    # Replace listContainer.innerHTML = `...` or container.innerHTML = `...` inside the if block
    
    # Sermons, Lyrics, Documents use: listContainer.innerHTML = `
    # Gallery, Golden Jubilee, Branch Chanchin use: container.innerHTML = ` or listContainer.innerHTML = `
    
    parts = content.split("<h3>" + empty_text + "</h3>")
    if len(parts) == 2:
        # We need to find the `innerHTML = \`` before it
        before = parts[0]
        last_innerhtml = max(before.rfind('listContainer.innerHTML = `'), before.rfind('container.innerHTML = `'))
        if last_innerhtml != -1:
            is_listContainer = before[last_innerhtml:].startswith('listContainer')
            var_name = 'listContainer' if is_listContainer else 'container'
            
            replacement = f"""if (!dataLoaded) {{
      {var_name}.innerHTML = `
        <div style="grid-column: 1 / -1; width: 100%; text-align: center; padding: var(--sp-8); color: var(--color-text-tertiary);">
          <div class="loading-spinner" style="margin: 0 auto var(--sp-3) auto;"></div>
          Loading records...
        </div>
      `;
    }} else {{
      {var_name}.innerHTML = `"""
            
            # Replace the last innerHTML = `
            content = content[:last_innerhtml] + replacement + content[last_innerhtml + len(var_name + '.innerHTML = `'):]
            
            # Now find the closing ``;` for this block
            # Since we split at <h3>..., the closing ``;` is in parts[1]
            first_semicolon = content.find("`;", last_innerhtml + len(replacement))
            if first_semicolon != -1:
                content = content[:first_semicolon + 2] + "\n    }" + content[first_semicolon + 2:]
                
            print(f"Fixed {file} ({empty_text})")
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
