import os, glob

files = glob.glob('assets/js/*.js')

new_btn_content = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg><span style="font-size:14px;font-weight:600;">Downloading...</span></div>'

new_icon_content = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>'

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Text buttons
    content = content.replace("'⏳ Downloading...';", f"'{new_btn_content}';")
    # Icon buttons (lightbox)
    content = content.replace("'<span style=\"font-size: 14px;\">⏳ Downloading...</span>';", f"'{new_icon_content}';")
    content = content.replace("'<span style=\"font-size: 14px;\">⏳</span>';", f"'{new_icon_content}';")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
