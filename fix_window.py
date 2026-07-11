import glob, re

for f in glob.glob('assets/js/*.js'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace window.open(url, '_blank'); or window.open(file.url, '_blank'); with iframe logic
    if "window.open(" in content:
        # Match something like: window.open(url, '_blank');
        # or window.open(dlUrl, '_blank');
        
        def rep(match):
            v = match.group(1)
            # if it's an external URL like for instagram/facebook, leave it alone.
            # but usually this is in a catch block inside download.
            return f"""let fid='';
          let m1={v}.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
          let m2={v}.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if(m1) fid=m1[1]; else if(m2) fid=m2[1];
          let act = fid ? `https://drive.google.com/uc?export=download&id=${{fid}}` : {v};
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = act;
          document.body.appendChild(iframe);
          setTimeout(() => document.body.removeChild(iframe), 5000);"""
          
        new_content, count = re.subn(r"window\.open\((url|dlUrl|file\.url),\s*'_blank'\);", rep, content)
        if count > 0:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Fixed window.open in {f} ({count} replacements)")
