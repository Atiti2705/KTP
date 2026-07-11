import glob, re

js_files = glob.glob('assets/js/*.js')
html_files = ['index.html']

for f in js_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Fix the bulk download loops to extract fileId and use the iframe trick properly.
    # The current bulk catch block looks like:
    # const iframe = document.createElement('iframe');
    # iframe.style.display = 'none';
    # iframe.src = file.url;
    # document.body.appendChild(iframe);
    # setTimeout(() => document.body.removeChild(iframe), 5000);
    
    pattern1 = r"const iframe = document\.createElement\('iframe'\);\s*iframe\.style\.display = 'none';\s*iframe\.src = (file\.url|url);\s*document\.body\.appendChild\(iframe\);\s*setTimeout\(\(\) => document\.body\.removeChild\(iframe\), 5000\);"
    
    def replacer1(match):
        var_name = match.group(1)
        return f"""let fileId = '';
          const match1 = {var_name}.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
          const match2 = {var_name}.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (match1 && match1[1]) fileId = match1[1];
          else if (match2 && match2[1]) fileId = match2[1];
          const actualDlUrl = fileId ? `https://drive.google.com/uc?export=download&id=${{fileId}}` : {var_name};
          
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = actualDlUrl;
          document.body.appendChild(iframe);
          setTimeout(() => document.body.removeChild(iframe), 5000);"""
          
    content, count1 = re.subn(pattern1, replacer1, content)
    
    if count1 > 0:
        print(f"Fixed bulk iframe logic in {f}")

    # 2. Fix inline window.open in branch-info.js (Lawmpuina/Sunna docs)
    # onclick="window.open('${doc.url}', '_blank'); event.preventDefault(); event.stopPropagation(); return false;"
    if "window.open('${doc.url}', '_blank')" in content:
        content = content.replace("window.open('${doc.url}', '_blank');", """
            let u = '${doc.url}';
            let fid = '';
            let m1 = u.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
            let m2 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (m1) fid = m1[1];
            else if (m2) fid = m2[1];
            let dl = fid ? `https://drive.google.com/uc?export=download&id=${fid}` : u;
            const fr = document.createElement('iframe');
            fr.style.display = 'none';
            fr.src = dl;
            document.body.appendChild(fr);
            setTimeout(() => document.body.removeChild(fr), 5000);
        """.replace('\n', ' '))
        print(f"Fixed inline window.open in {f}")

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

# 3. Fix index.html inline window.open for sermons
for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if "window.open('${sermon.downloadUrl}', '_blank')" in content:
        content = content.replace("window.open('${sermon.downloadUrl}', '_blank')", """
            (function(u){
                let fid='';
                let m1=u.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
                let m2=u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                if(m1) fid=m1[1]; else if(m2) fid=m2[1];
                let dl = fid ? `https://drive.google.com/uc?export=download&id=${fid}` : u;
                const fr = document.createElement('iframe');
                fr.style.display='none';
                fr.src=dl;
                document.body.appendChild(fr);
                setTimeout(()=>document.body.removeChild(fr), 5000);
            })('${sermon.downloadUrl}')
        """.replace('\n', ' '))
        print(f"Fixed inline window.open in {f}")
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
