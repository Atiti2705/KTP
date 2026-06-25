import os
import re

directory = r'd:\papuia\Web\KTP Website'

for root, _, files in os.walk(directory):
    if 'node_modules' in root or '.git' in root or '.firebase' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Bump ALL CSS and JS files to ?v=105
            new_content = re.sub(r'(\.js|\.css)\?v=\d+', r'\1?v=105', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
