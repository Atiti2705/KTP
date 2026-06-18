
    document.addEventListener('DOMContentLoaded', async () => {
      // Render static header and footer immediately for fast visual load
      renderHeader('home');
      renderFooter();

      // Render immediately with local/cached data
      renderHomepage();

      // Load dynamic databases in parallel
      try {
        const [annData, photoData, docData, sermonData, obData, settings] = await Promise.all([
          DbService.get('announcements').catch(() => null),
          DbService.get('photos').catch(() => null),
          DbService.get('documents').catch(() => null),
          DbService.get('sermons').catch(() => null),
          DbService.get('ob_members').catch(() => null),
          DbService.get('settings').catch(() => null)
        ]);

        let needsRerender = false;

        if (annData && Array.isArray(annData)) {
          Announcements.length = 0;
          Announcements.push(...annData);
          needsRerender = true;
        }
        if (photoData && Array.isArray(photoData)) {
          Photos.length = 0;
          Photos.push(...photoData);
          needsRerender = true;
        }
        if (docData && Array.isArray(docData)) {
          Documents.length = 0;
          Documents.push(...docData);
          needsRerender = true;
        }
        if (sermonData && Array.isArray(sermonData)) {
          Sermons.length = 0;
          Sermons.push(...sermonData);
          needsRerender = true;
        }
        if (obData && Array.isArray(obData)) {
          ObMembers.length = 0;
          ObMembers.push(...obData);
          needsRerender = true;
        }

        if (settings) {
          if (settings.churchInfo) Object.assign(ChurchInfo, settings.churchInfo);
          if (settings.socialMedia) Object.assign(SocialMedia, settings.socialMedia);
          
          // Re-render header/footer if settings were fetched from DB
          renderHeader('home');
          renderFooter();
          needsRerender = true;
        }

        if (needsRerender) {
          renderHomepage();
        }
      } catch (err) {
        console.error("Error loading home page database...", err);
      }
    });

    function renderHomepage() {
      // Hide standard hero elements if they exist
      const heroContent = document.querySelector('.hero-content');
      if (heroContent) heroContent.style.display = 'none';

      // Rebuild main structure
      const main = document.querySelector('.main-content');
      main.innerHTML = `
        <!-- OFFICE BEARERS -->
        <div id="ob-members-widget" style="padding: 15px; border-bottom: 1px solid var(--color-border-light); background: var(--color-bg);">
          <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 14px; font-weight: 600; color: var(--color-text); text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">2026 Office Bearers</h3>
          <div id="ob-members-container" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); row-gap: 20px; column-gap: 10px; padding-bottom: 5px;">
            <!-- Populated by JS -->
          </div>
        </div>

        <!-- ANNOUNCEMENTS FEED -->
        <div id="announcements-widget" style="padding-top: 15px; padding-bottom: 15px; background: var(--color-bg-alt); min-height: 50vh;">
          <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 14px; font-weight: 600; color: var(--color-text); text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Announcements</h3>
          <div id="announcements-feed-container" style="display: flex; flex-direction: column;">
            <!-- Populated by JS -->
          </div>
        </div>
      `;

      renderOBMembers();
      renderAnnouncementsFeed();
    }

    function renderAnnouncementsFeed() {
      const container = document.getElementById('announcements-feed-container');
      if (!container) return;

      const sorted = [...Announcements].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      if (sorted.length === 0) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = sorted.map(ann => {
        const authorName = "KṬP Saikhamakawn";
        const authorAvatar = "assets/images/logo.png";
        
        let mediaHtml = '';
        if (ann.imageUrl) {
          const finalUrl = typeof convertDriveUrl === 'function' ? convertDriveUrl(ann.imageUrl) : ann.imageUrl;
          mediaHtml = `<img src="${finalUrl}" class="ig-post-media" alt="${ann.title}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/logo.png';" style="width: 100%; max-height: 500px; object-fit: contain; background: black;">`;
        } else {
          mediaHtml = `
            <div style="padding: 40px 20px; background: var(--color-bg); text-align: center; border-top: 1px solid var(--color-border-light); border-bottom: 1px solid var(--color-border-light);">
              <span style="font-size: 3rem;">📢</span>
              <h3 style="margin-top: 10px; font-size: 1.2rem;">${ann.title}</h3>
            </div>
          `;
        }

        const likesCount = Math.floor(Math.random() * 200) + 15;

        return `
          <div class="ig-post" style="background: var(--color-bg); margin-bottom: 15px; border-bottom: 1px solid var(--color-border-light);">
            <div class="ig-post-header" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px;">
              <div class="ig-post-user" style="display: flex; align-items: center; text-decoration: none; color: inherit;">
                <img src="${authorAvatar}" class="ig-post-avatar" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; border: 1px solid var(--color-border-light);">
                <span class="ig-post-username" style="font-weight: 600; font-size: 14px;">${authorName}</span>
              </div>
              <button class="ig-post-options" style="background: none; border: none; color: var(--color-text);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle></svg>
              </button>
            </div>
            
            ${mediaHtml}

            <div class="ig-post-actions" style="display: flex; justify-content: space-between; padding: 10px 15px 5px;">
              <div class="ig-post-actions-left" style="display: flex; gap: 15px;">
                <button class="ig-post-action-btn" onclick="this.style.color='var(--brand-red)'" style="background: none; border: none; padding: 0; color: var(--color-text);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
                <button class="ig-post-action-btn" style="background: none; border: none; padding: 0; color: var(--color-text);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></button>
                <button class="ig-post-action-btn" style="background: none; border: none; padding: 0; color: var(--color-text);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
              </div>
              <button class="ig-post-action-btn" style="background: none; border: none; padding: 0; color: var(--color-text);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>
            </div>

            <div class="ig-post-likes" style="padding: 0 15px; font-weight: 600; font-size: 14px; margin-bottom: 5px;">${likesCount} likes</div>
            
            <div class="ig-post-caption" style="padding: 0 15px; font-size: 14px; line-height: 1.4; margin-bottom: 5px;">
              <span class="username" style="font-weight: 600;">${authorName}</span> ${ann.title} ${ann.linkUrl ? `<br><a href="${ann.linkUrl}" style="color: var(--brand-sky);">Read more</a>` : ''}
            </div>

            <div class="ig-post-time" style="padding: 0 15px; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 10px; text-transform: uppercase;">${ann.date ? formatDate(ann.date) : ''}</div>
          </div>
        `;
      }).join('');
    }

    function renderOBMembers() {
      const container = document.getElementById('ob-members-container');
      if (!container) return;

      const obMembers = (typeof ObMembers !== 'undefined' && ObMembers.length > 0) ? ObMembers : [
        { id: 'ob-1', name: "Leader", position: "Leader", image: "assets/images/logo.png" },
        { id: 'ob-2', name: "Asst. Leader", position: "Asst. Leader", image: "assets/images/logo.png" },
        { id: 'ob-3', name: "Secretary", position: "Secretary", image: "assets/images/logo.png" },
        { id: 'ob-4', name: "Asst. Secretary", position: "Asst. Secretary", image: "assets/images/logo.png" },
        { id: 'ob-5', name: "Treasurer", position: "Treasurer", image: "assets/images/logo.png" },
        { id: 'ob-6', name: "Fin. Secretary", position: "Fin. Secretary", image: "assets/images/logo.png" }
      ];

      container.innerHTML = obMembers.map(ob => {
        const imageUrl = ob.image && typeof convertDriveUrl === 'function' ? convertDriveUrl(ob.image) : (ob.image || 'assets/images/logo.png');
        return `
        <div class="ob-card" style="display: flex; flex-direction: column; align-items: center; text-decoration: none; color: inherit; text-align: center; min-width: 0;">
          <div style="width: 60px; height: 60px; border-radius: 50%; padding: 2px; border: 2px solid var(--brand-sky); margin-bottom: 6px; cursor: pointer;" onclick="openOBPreviewModal(this.dataset.img, this.dataset.name, this.dataset.position)" data-img="${imageUrl}" data-name="${(ob.name||'').replace(/&/g, '&amp;').replace(/\"/g, '&quot;')}" data-position="${(ob.position||'').replace(/&/g, '&amp;').replace(/\"/g, '&quot;')}">
            <img src="${imageUrl}" alt="${ob.name}" onerror="this.onerror=null; this.src='assets/images/logo.png';" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-bg);">
          </div>
          <div style="font-size: clamp(9px, 2.6vw, 12px); font-weight: 600; color: var(--color-text); width: 100%; white-space: nowrap; overflow: visible; letter-spacing: -0.3px;">${ob.name}</div>
          <div style="font-size: 11px; color: var(--color-text-secondary); margin-top: 2px;">${ob.position}</div>
        </div>
      `}).join('');
    }

    function renderSocialGrid() {
      const container = document.getElementById('social-grid');
      if (!container) return;

      container.innerHTML = `
        <a href="${SocialMedia.instagram.url}" target="_blank" rel="noopener" class="social-card instagram" id="social-instagram">
          <div class="social-card-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></div>
          <span class="social-card-name">${SocialMedia.instagram.label}</span>
          <span class="social-card-handle">${SocialMedia.instagram.handle}</span>
        </a>
        <a href="${SocialMedia.facebook.url}" target="_blank" rel="noopener" class="social-card facebook" id="social-facebook">
          <div class="social-card-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
          <span class="social-card-name">${SocialMedia.facebook.label}</span>
          <span class="social-card-handle">${SocialMedia.facebook.handle}</span>
        </a>
        <a href="${SocialMedia.youtube.url}" target="_blank" rel="noopener" class="social-card youtube" id="social-youtube">
          <div class="social-card-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></div>
          <span class="social-card-name">${SocialMedia.youtube.label}</span>
          <span class="social-card-handle">${SocialMedia.youtube.handle}</span>
        </a>
      `;
    }

    function openOBPreviewModal(imgUrl, name, position) {
      document.getElementById('ob-preview-image').src = imgUrl;
      document.getElementById('ob-preview-image').onerror = function() {
        this.onerror = null;
        this.src = 'assets/images/logo.png';
      };
      document.getElementById('ob-preview-name').textContent = name;
      document.getElementById('ob-preview-position').textContent = position;
      
      const modal = document.getElementById('ob-preview-modal');
      modal.style.display = 'flex';
      
      modal.onclick = function(e) {
        if (e.target === modal) {
          closeOBPreviewModal();
        }
      };
    }

    function closeOBPreviewModal() {
      document.getElementById('ob-preview-modal').style.display = 'none';
      document.getElementById('ob-preview-image').src = '';
    }
  