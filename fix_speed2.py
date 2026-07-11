import os

files_to_fix = [
    ('assets/js/sermons.js', 'No Sermons Found', "DbService.get('sermons')"),
    ('assets/js/lyrics.js', 'No Lyrics Found', "DbService.get('lyrics')"),
    ('assets/js/documents.js', 'No Documents Found', "DbService.get("),
    ('assets/js/gallery.js', 'No Photos Found', "DbService.get('photos')"),
    ('assets/js/golden-jubilee.js', 'No Folders Found', "DbService.get("),
    ('assets/js/branch-chanchin.js', 'No BranchChanchin Found', "DbService.get('branch-chanchin')")
]

for file, empty_text, fetch_code in files_to_fix:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'let dataLoaded =' in content:
        continue
        
    lines = content.split('\n')
    new_lines = []
    
    inside_empty = False
    
    for i, line in enumerate(lines):
        if "document.addEventListener('DOMContentLoaded'," in line:
            new_lines.append("let dataLoaded = false;")
            new_lines.append("")
        
        # Add dataLoaded = true in then and catch blocks
        if fetch_code in line and ".then(" in line:
            new_lines.append(line)
            new_lines.append("    dataLoaded = true;")
            continue
            
        if ".catch(" in line and ("console.error" in line or "err =>" in line or "error =>" in line):
            # E.g. }).catch(error => console.error("Error", error));
            # Change to: }).catch(error => { dataLoaded = true; console.error("Error", error); });
            if line.strip().startswith('}).catch(') or line.strip().startswith('.catch('):
                if ')' in line and '=>' in line:
                    if not '{' in line.split('=>')[1]:
                        # single line arrow function
                        parts = line.split('=>')
                        head = parts[0] + '=>'
                        tail = parts[1].strip()
                        if tail.endswith(';'): tail = tail[:-1]
                        if tail.endswith(')'): tail = tail[:-1]
                        new_line = f"{head} {{ dataLoaded = true; {tail}; }});"
                        new_lines.append(new_line)
                        continue
        
        # Fixing the empty state
        if 'if (paginationData.items.length === 0)' in line or 'if (result.length === 0)' in line or 'if (folders.length === 0)' in line or 'if (items.length === 0)' in line or 'if (filtered.length === 0)' in line:
            new_lines.append(line)
            continue
            
        if 'listContainer.innerHTML = `' in line or 'container.innerHTML = `' in line:
            # Look ahead to see if this is the empty state block
            is_empty_state = False
            for j in range(i, min(i+10, len(lines))):
                if empty_text in lines[j] or 'No Items Match Search' in lines[j]:
                    is_empty_state = True
                    break
            
            if is_empty_state:
                var_name = 'listContainer' if 'listContainer' in line else 'container'
                new_lines.append(f"    if (!dataLoaded) {{")
                new_lines.append(f"      {var_name}.innerHTML = `")
                new_lines.append(f'        <div style="grid-column: 1 / -1; width: 100%; text-align: center; padding: var(--sp-8); color: var(--color-text-tertiary);">')
                new_lines.append(f'          <div class="loading-spinner" style="margin: 0 auto var(--sp-3) auto;"></div>')
                new_lines.append(f'          Loading records...')
                new_lines.append(f'        </div>')
                new_lines.append(f"      `;")
                new_lines.append(f"    }} else {{")
                new_lines.append(line)
                inside_empty = True
                continue
                
        if inside_empty and '`;' in line:
            new_lines.append(line)
            new_lines.append("    }")
            inside_empty = False
            continue
            
        new_lines.append(line)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
        print(f"Fixed {file}")
