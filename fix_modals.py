import os, glob, re

files = glob.glob('assets/js/*.js')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # The pattern we want to match:
    # modalDownload.href = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : downloadUrl;
    # modalDownload.onclick = () => {
    #   Toast.show(`Downloading ${whatever.title}...`, 'success');
    # };
    
    pattern = r"modalDownload\.href\s*=\s*fileId\s*\?\s*`https://drive\.google\.com/uc\?export=download&id=\$\{fileId\}`\s*:\s*downloadUrl;\s*modalDownload\.onclick\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\};"
    
    def replacer(match):
        inner_toast = match.group(1).strip()
        return f"""const actualDlUrl = fileId ? `https://drive.google.com/uc?export=download&id=${{fileId}}` : downloadUrl;
      modalDownload.href = actualDlUrl;
      modalDownload.onclick = (e) => {{
        e.preventDefault();
        {inner_toast}
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = actualDlUrl;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 5000);
      }};"""
      
    new_content, count = re.subn(pattern, replacer, content)
    if count > 0:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated {f} ({count} replacements)")
