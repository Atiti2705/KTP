import os
import re

import time

directory = r'd:\papuia\Web\KTP Website'

# Generate a unique version string based on the current timestamp
new_version = int(time.time())

for root, _, files in os.walk(directory):
    if 'node_modules' in root or '.git' in root or '.firebase' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Bump ALL CSS and JS files to the new version
            new_content = re.sub(r'(\.js|\.css)\?v=\d+', rf'\1?v={new_version}', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
