fetch("https://www.youtube.com/@ktpskk").then(r=>r.text()).then(t=>{
    let m = t.match(/"channelId":"(UC[^"]+)"/);
    if(!m) m = t.match(/<meta itemprop="identifier" content="(UC[^"]+)">/);
    if(!m) m = t.match(/canonical.*channel\/(UC[^"]+)/);
    if(m) console.log(m[1]);
    else console.log('Not found. Length:', t.length);
})
