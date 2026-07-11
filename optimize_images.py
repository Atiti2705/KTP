import sys
import glob

# 1. Update data.js convertDriveUrl
with open('assets/js/data.js', 'r', encoding='utf-8') as f:
    data_content = f.read()

data_content = data_content.replace(
    'return `https://lh3.googleusercontent.com/d/${fileId}`;',
    'return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;'
)

with open('assets/js/data.js', 'w', encoding='utf-8') as f:
    f.write(data_content)

# 2. Fix the =s0 appending in all JS files
for js_file in glob.glob('assets/js/*.js'):
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = content.replace("url += '=s0';", "url = url.split('=')[0] + '=s0';")
    modified = modified.replace("dlUrl += '=s0';", "dlUrl = dlUrl.split('=')[0] + '=s0';")
    
    if modified != content:
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(modified)
        print('Updated ' + js_file)
print('Done')
