/**
 * LORFAB PHOTOS - Photographic Archive & 3D WebGL Globe
 * Minimal, Pure Vanilla ES6+, Open Source, Zero Paid APIs
 */

(() => {
  'use strict';

  // --- State Management ---
  const state = {
    viaggi: [],
    manifest: {},
    selectedTrip: null,
    activeGalleryPhotos: [],
    lightboxIndex: 0,
    globeInstance: null,
    autoRotateTimeout: null,
    isUserInteracting: false,
    lastMarkerClickTime: 0
  };

  // --- DOM Elements ---
  const DOM = {
    body: document.body,
    globeContainer: document.getElementById('globe-container'),
    globeHint: document.getElementById('globe-hint'),
    statusLabel: document.getElementById('status-label'),
    archiveStat: document.getElementById('archive-stat-counter'),
    
    // Trip Overlay Card
    tripCard: document.getElementById('trip-card'),
    cardTitle: document.getElementById('card-title'),
    cardSubtitle: document.getElementById('card-subtitle'),
    cardYear: document.getElementById('card-year'),
    cardCount: document.getElementById('card-count'),
    cardStory: document.getElementById('card-story'),
    cardPreviewContainer: document.getElementById('card-preview-container'),
    cardPreviewImg: document.getElementById('card-preview-img'),
    cardCloseBtn: document.getElementById('card-close-btn'),
    btnOpenGallery: document.getElementById('btn-open-gallery'),

    // Gallery View
    galleryView: document.getElementById('gallery-view'),
    galleryBackBtn: document.getElementById('gallery-back-btn'),
    galleryTitle: document.getElementById('gallery-title'),
    gallerySubtitle: document.getElementById('gallery-subtitle'),
    galleryCountBadge: document.getElementById('gallery-count-badge'),
    galleryStoryText: document.getElementById('gallery-story-text'),
    galleryGrid: document.getElementById('gallery-grid'),

    // Lightbox
    lightbox: document.getElementById('lightbox'),
    lightboxBackdrop: document.getElementById('lightbox-backdrop'),
    lightboxImage: document.getElementById('lightbox-image'),
    lightboxCaption: document.getElementById('lightbox-caption'),
    lightboxCounter: document.getElementById('lightbox-counter'),
    lightboxClose: document.getElementById('lightbox-close'),
    lightboxPrev: document.getElementById('lightbox-prev'),
    lightboxNext: document.getElementById('lightbox-next'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // --- Toast Notification Helper ---
  function showToast(message, duration = 4000) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- Initialize Application ---
  async function init() {
    try {
      await loadData();
      initGlobe();
      setupEventListeners();
      updateGlobalStats();
    } catch (error) {
      console.error('Inizializzazione fallita:', error);
      showToast('Errore nel caricamento dell\'archivio fotografico.');
    }
  }

  // --- Load Data (viaggi.json + manifest.json) ---
  async function loadData() {
    try {
      const [resViaggi, resManifest] = await Promise.all([
        fetch('./viaggi.json'),
        fetch('./manifest.json')
      ]);

      if (!resViaggi.ok) throw new Error(`viaggi.json non trovato (${resViaggi.status})`);
      if (!resManifest.ok) throw new Error(`manifest.json non trovato (${resManifest.status})`);

      state.viaggi = await resViaggi.json();
      state.manifest = await resManifest.json();
    } catch (err) {
      console.warn('Avviso: impossibile caricare i dati via fetch (possibile visualizzazione da file:// locale):', err);
      showToast('Modalità fallback attiva. Per la migliore esperienza, esegui tramite server web.');
      
      // Fallback minimale se fetch locale fallisce
      state.viaggi = [
        {
          id: "uzbekistan",
          titolo: "Uzbekistan",
          sottotitolo: "Dalla Via della Seta al post-brutalismo sovietico",
          lat: 41.2995,
          lng: 69.2401,
          storia: "Un percorso attraverso città, architetture e paesaggi dell'Asia Centrale.",
          anno: 2025
        },
        {
          id: "bosnia",
          titolo: "Bosnia",
          sottotitolo: "Tracce indelebili di un passato ancora presente",
          lat: 43.8563,
          lng: 18.4131,
          storia: "Un percorso attraverso luoghi che conservano ancora le tracce della storia recente dei Balcani.",
          anno: 2025
        },
        {
          id: "armenia",
          titolo: "Armenia",
          sottotitolo: "Monasteri di pietra e memorie del Caucaso",
          lat: 40.1792,
          lng: 44.4991,
          storia: "Tra altipiani vulcanici e antiche pietre intagliate all'ombra del Monte Ararat.",
          anno: 2024
        }
      ];
      state.manifest = {
        uzbekistan: ["viaggi/uzbekistan/001.jpg", "viaggi/uzbekistan/002.jpg", "viaggi/uzbekistan/003.jpg"],
        bosnia: ["viaggi/bosnia/001.jpg", "viaggi/bosnia/002.jpg"],
        armenia: ["viaggi/armenia/001.jpg"]
      };
    }
  }

  // --- Calculate and Display Global Stats ---
  function updateGlobalStats() {
    const tripCount = state.viaggi.length;
    let photoCount = 0;

    for (const trip of state.viaggi) {
      const photos = state.manifest[trip.id] || [];
      photoCount += photos.length;
    }

    if (DOM.archiveStat) {
      DOM.archiveStat.textContent = `${tripCount} VIAGGI — ${photoCount} FOTOGRAFIE`;
    }
  }

  // --- 3D WebGL Globe Initialization (Globe.gl / Three.js) ---
  function initGlobe() {
    if (!DOM.globeContainer) return;

    // Dark Earth NASA night / dark satellite texture (Open Source / Public Domain)
    const EARTH_DARK_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
    const EARTH_BUMP_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-topology.png';

    // Prepare HTML Elements Data for custom typographic and glowing markers
    const markerData = state.viaggi
      .filter(trip => typeof trip.lat === 'number' && typeof trip.lng === 'number')
      .map(trip => {
        const photos = state.manifest[trip.id] || [];
        return {
          ...trip,
          photoCount: photos.length,
          coverPhoto: photos[0] || ''
        };
      });

    // Create Globe.gl instance
    state.globeInstance = Globe()(DOM.globeContainer)
      .globeImageUrl(EARTH_DARK_TEXTURE)
      .bumpImageUrl(EARTH_BUMP_TEXTURE)
      .backgroundColor('#0a0a0a')
      .showAtmosphere(true)
      .atmosphereColor('#ffffff')
      .atmosphereAltitude(0.12)
      // Custom HTML Marker Layer
      .htmlElementsData(markerData)
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlAltitude(0.015)
      .htmlElement(d => createMarkerElement(d))
      // Rings for glowing pulsing beacon with click handler
      .ringsData(markerData)
      .ringLat(d => d.lat)
      .ringLng(d => d.lng)
      .ringAltitude(0.01)
      .ringColor(() => () => 'rgba(255, 255, 255, 0.45)')
      .ringMaxRadius(3.5)
      .ringPropagationSpeed(1.2)
      .ringRepeatPeriod(2400)
      // 3D Raycasting hit-target layer around each marker
      .pointsData(markerData)
      .pointLat(d => d.lat)
      .pointLng(d => d.lng)
      .pointAltitude(0.015)
      .pointColor(() => 'rgba(255, 255, 255, 0.001)')
      .pointRadius(3.0)
      .onPointClick((d, event) => {
        if (event) event.stopPropagation?.();
        state.lastMarkerClickTime = Date.now();
        selectTrip(d);
      });

    // Initial camera position & controls configuration
    const controls = state.globeInstance.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.minDistance = 150;
    controls.maxDistance = 600;

    // Focus camera initially over Europe / Mediterranean
    state.globeInstance.pointOfView({ lat: 42.0, lng: 30.0, altitude: 2.2 }, 1000);

    // Setup Auto-Rotation Pause/Resume on User Interaction
    const handleUserInteractionStart = () => {
      controls.autoRotate = false;
      state.isUserInteracting = true;
      if (DOM.globeHint) DOM.globeHint.classList.add('hidden');
      if (state.autoRotateTimeout) clearTimeout(state.autoRotateTimeout);
    };

    const handleUserInteractionEnd = () => {
      state.isUserInteracting = false;
      if (state.autoRotateTimeout) clearTimeout(state.autoRotateTimeout);
      // Resume slow rotation after 7 seconds of inactivity
      state.autoRotateTimeout = setTimeout(() => {
        if (!state.isUserInteracting && !state.selectedTrip && !DOM.galleryView.classList.contains('active')) {
          controls.autoRotate = true;
        }
      }, 7000);
    };

    controls.addEventListener('start', handleUserInteractionStart);
    controls.addEventListener('end', handleUserInteractionEnd);

    // Click on empty globe closes open cards (with debounce protection against marker clicks)
    state.globeInstance.onGlobeClick(() => {
      if (Date.now() - state.lastMarkerClickTime < 600) return;
      closeTripCard();
    });

    // Handle Window Resize
    window.addEventListener('resize', () => {
      if (state.globeInstance) {
        state.globeInstance
          .width(window.innerWidth)
          .height(window.innerHeight);
      }
    });
  }

  // --- Create Custom Marker DOM Element ---
  function createMarkerElement(tripData) {
    const marker = document.createElement('div');
    const stemHeight = typeof tripData.stem_height === 'number' ? tripData.stem_height : 28;
    marker.className = 'globe-marker-node';
    marker.style.setProperty('--stem-height', `${stemHeight}px`);
    marker.setAttribute('data-id', tripData.id);
    marker.setAttribute('role', 'button');
    marker.setAttribute('tabindex', '0');
    marker.setAttribute('aria-label', `Seleziona viaggio in ${tripData.titolo} (${tripData.paese || ''})`);

    const flagHtml = tripData.codice_paese 
      ? `<img src="https://flagcdn.com/w40/${tripData.codice_paese.toLowerCase()}.png" class="marker-flag" alt="${tripData.paese || ''}" loading="lazy" />` 
      : '';

    const labelText = tripData.label || tripData.titolo.toUpperCase();

    marker.innerHTML = `
      <div class="marker-label">
        ${flagHtml}
        <span>${labelText}</span>
      </div>
      <div class="marker-stem"></div>
      <div class="marker-beacon">
        <div class="marker-core"></div>
        <div class="marker-ring"></div>
      </div>
    `;

    let startX = 0;
    let startY = 0;

    marker.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      e.stopPropagation();
    });

    const handleTrigger = (e) => {
      if (e) {
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        if (e.type === 'pointerup') {
          const moveDist = Math.hypot(e.clientX - startX, e.clientY - startY);
          if (moveDist > 10) return; // User was dragging the globe, ignore click
        }
      }
      state.lastMarkerClickTime = Date.now();
      selectTrip(tripData);
    };

    marker.addEventListener('click', handleTrigger);
    marker.addEventListener('pointerup', handleTrigger);
    marker.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleTrigger(e);
    });

    marker.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTrigger(e);
      }
    });

    return marker;
  }

  // --- Trip Selection & Fly-to Animation ---
  function selectTrip(trip) {
    state.selectedTrip = trip;
    state.lastMarkerClickTime = Date.now();

    // Fly camera smoothly to the selected coordinates
    if (state.globeInstance) {
      state.globeInstance.controls().autoRotate = false;
      state.globeInstance.pointOfView(
        { lat: trip.lat, lng: trip.lng, altitude: 1.5 },
        1200
      );
    }

    // Highlight marker in DOM
    document.querySelectorAll('.globe-marker-node').forEach(node => {
      if (node.getAttribute('data-id') === trip.id) {
        node.classList.add('selected');
      } else {
        node.classList.remove('selected');
      }
    });

    // Read photo data from manifest
    const photos = state.manifest[trip.id] || [];
    const photoCountText = `${photos.length} FOTOGRAFIE`;
    const coverPhoto = photos[0] || '';

    // Summary story for the preview card
    const summaryStory = trip.storia || (Array.isArray(trip.articolo) ? trip.articolo[0] : trip.articolo) || '';

    // Country Flag
    const flagHtml = trip.codice_paese 
      ? `<img src="https://flagcdn.com/w40/${trip.codice_paese.toLowerCase()}.png" class="card-flag" alt="${trip.paese || ''}" />` 
      : '';

    // Populate Info Card
    DOM.cardTitle.innerHTML = `${flagHtml}${trip.titolo}`;
    DOM.cardSubtitle.textContent = trip.sottotitolo || '';
    DOM.cardYear.textContent = trip.anno ? trip.anno : 'ARCHIVIO';
    DOM.cardCount.textContent = photoCountText;
    DOM.cardStory.textContent = summaryStory;

    if (coverPhoto) {
      DOM.cardPreviewImg.src = encodeURI(coverPhoto);
      DOM.cardPreviewImg.alt = trip.titolo;
      DOM.cardPreviewContainer.style.display = 'block';
    } else {
      DOM.cardPreviewContainer.style.display = 'none';
    }

    // Show Trip Card
    DOM.tripCard.classList.add('active');
    DOM.tripCard.setAttribute('aria-hidden', 'false');
    
    if (DOM.statusLabel) {
      DOM.statusLabel.textContent = `LUOGO SELEZIONATO: ${trip.titolo.toUpperCase()}`;
    }
  }

  // --- Close Trip Card ---
  function closeTripCard() {
    state.selectedTrip = null;
    DOM.tripCard.classList.remove('active');
    DOM.tripCard.setAttribute('aria-hidden', 'true');

    document.querySelectorAll('.globe-marker-node').forEach(node => {
      node.classList.remove('selected');
    });

    if (DOM.statusLabel) {
      DOM.statusLabel.textContent = 'EXPLORE THE GLOBE';
    }

    // Resume auto-rotation after delay
    if (state.globeInstance) {
      setTimeout(() => {
        if (!state.selectedTrip && !DOM.galleryView.classList.contains('active')) {
          state.globeInstance.controls().autoRotate = true;
        }
      }, 3000);
    }
  }

  // --- Open Editorial Gallery ---
  function openGallery(trip) {
    if (!trip) return;

    closeTripCard();
    DOM.body.classList.remove('globe-active');

    const photos = state.manifest[trip.id] || [];
    state.activeGalleryPhotos = photos;

    const flagHtml = trip.codice_paese 
      ? `<img src="https://flagcdn.com/w40/${trip.codice_paese.toLowerCase()}.png" class="gallery-flag" alt="${trip.paese || ''}" />` 
      : '';

    DOM.galleryTitle.innerHTML = `${flagHtml}${trip.titolo}`;
    DOM.gallerySubtitle.textContent = trip.sottotitolo || '';
    DOM.galleryCountBadge.textContent = `${photos.length} FOTOGRAFIE`;

    // Render Article & Peculiarities
    const narrativeContainer = document.getElementById('gallery-intro-narrative');
    if (narrativeContainer) {
      let articleParagraphs = [];
      if (Array.isArray(trip.articolo)) {
        articleParagraphs = trip.articolo;
      } else if (typeof trip.articolo === 'string' && trip.articolo.trim()) {
        articleParagraphs = trip.articolo.split('\n\n');
      } else if (trip.storia) {
        articleParagraphs = [trip.storia];
      }

      let peculiaritiesHtml = '';
      if (Array.isArray(trip.peculiarita) && trip.peculiarita.length > 0) {
        const tags = trip.peculiarita.map(p => `<span class="peculiarity-tag">${p}</span>`).join('');
        peculiaritiesHtml = `
          <div class="gallery-peculiarities">
            <span class="gallery-peculiarities-title">PECULIARITÀ:</span>
            ${tags}
          </div>
        `;
      }

      const paragraphsHtml = articleParagraphs
        .map(p => `<p>${p.trim()}</p>`)
        .join('');

      narrativeContainer.innerHTML = `
        <span class="gallery-article-tag">NOTE DI VIAGGIO &amp; NARRAZIONE</span>
        <div class="gallery-article-body">
          ${paragraphsHtml}
        </div>
        ${peculiaritiesHtml}
      `;
    }

    // Clear previous gallery items
    DOM.galleryGrid.innerHTML = '';

    if (photos.length === 0) {
      DOM.galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: var(--text-muted);">
          <p>Nessuna fotografia presente in questa cartella.</p>
        </div>
      `;
    } else {
      photos.forEach((photoPath, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `Apri fotografia ${index + 1} di ${trip.titolo}`);

        const formattedIndex = String(index + 1).padStart(2, '0');
        const formattedTotal = String(photos.length).padStart(2, '0');

        item.innerHTML = `
          <img class="gallery-img" src="${encodeURI(photoPath)}" alt="${trip.titolo} — ${formattedIndex}" loading="lazy" />
          <div class="gallery-item-overlay">
            <span class="item-index">${formattedIndex} / ${formattedTotal}</span>
          </div>
        `;

        item.addEventListener('click', () => openLightbox(index));
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(index);
          }
        });

        DOM.galleryGrid.appendChild(item);
      });
    }

    DOM.galleryView.classList.add('active');
    DOM.galleryView.setAttribute('aria-hidden', 'false');
    DOM.galleryView.scrollTop = 0;
  }

  // --- Close Editorial Gallery ---
  function closeGallery() {
    DOM.galleryView.classList.remove('active');
    DOM.galleryView.setAttribute('aria-hidden', 'true');
    DOM.body.classList.add('globe-active');

    if (state.globeInstance) {
      state.globeInstance.controls().autoRotate = true;
    }
  }

  // --- Lightbox Operations ---
  function openLightbox(index) {
    if (!state.activeGalleryPhotos || state.activeGalleryPhotos.length === 0) return;

    state.lightboxIndex = index;
    updateLightboxContent();

    DOM.lightbox.classList.add('active');
    DOM.lightbox.setAttribute('aria-hidden', 'false');
    DOM.body.style.overflow = 'hidden';
  }

  function updateLightboxContent() {
    const photos = state.activeGalleryPhotos;
    const currentPhoto = photos[state.lightboxIndex];
    if (!currentPhoto) return;

    DOM.lightboxImage.src = encodeURI(currentPhoto);
    const formattedIndex = String(state.lightboxIndex + 1).padStart(2, '0');
    const formattedTotal = String(photos.length).padStart(2, '0');
    
    DOM.lightboxCounter.textContent = `${formattedIndex} / ${formattedTotal}`;
    
    if (state.selectedTrip) {
      DOM.lightboxCaption.textContent = `${state.selectedTrip.titolo} — ${formattedIndex}`;
    } else {
      DOM.lightboxCaption.textContent = `Fotografia ${formattedIndex}`;
    }
  }

  function closeLightbox() {
    DOM.lightbox.classList.remove('active');
    DOM.lightbox.setAttribute('aria-hidden', 'true');
    
    if (!DOM.galleryView.classList.contains('active')) {
      DOM.body.style.overflow = '';
    }
  }

  function nextPhoto() {
    if (!state.activeGalleryPhotos || state.activeGalleryPhotos.length === 0) return;
    state.lightboxIndex = (state.lightboxIndex + 1) % state.activeGalleryPhotos.length;
    updateLightboxContent();
  }

  function prevPhoto() {
    if (!state.activeGalleryPhotos || state.activeGalleryPhotos.length === 0) return;
    state.lightboxIndex = (state.lightboxIndex - 1 + state.activeGalleryPhotos.length) % state.activeGalleryPhotos.length;
    updateLightboxContent();
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Card Actions
    if (DOM.cardCloseBtn) {
      DOM.cardCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTripCard();
      });
    }

    if (DOM.btnOpenGallery) {
      DOM.btnOpenGallery.addEventListener('click', () => {
        if (state.selectedTrip) {
          openGallery(state.selectedTrip);
        }
      });
    }

    // Gallery Actions
    if (DOM.galleryBackBtn) {
      DOM.galleryBackBtn.addEventListener('click', () => {
        closeGallery();
      });
    }

    // Lightbox Controls
    if (DOM.lightboxClose) DOM.lightboxClose.addEventListener('click', closeLightbox);
    if (DOM.lightboxBackdrop) DOM.lightboxBackdrop.addEventListener('click', closeLightbox);
    if (DOM.lightboxNext) DOM.lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextPhoto(); });
    if (DOM.lightboxPrev) DOM.lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevPhoto(); });

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (DOM.lightbox.classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextPhoto();
        if (e.key === 'ArrowLeft') prevPhoto();
      } else if (DOM.galleryView.classList.contains('active')) {
        if (e.key === 'Escape') closeGallery();
      } else if (state.selectedTrip) {
        if (e.key === 'Escape') closeTripCard();
      }
    });

    // Touch Swipe Navigation for Lightbox
    let touchStartX = 0;
    let touchEndX = 0;

    DOM.lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    DOM.lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeDistance = touchEndX - touchStartX;
      const threshold = 45;
      if (swipeDistance < -threshold) {
        nextPhoto(); // Swipe left -> Next
      } else if (swipeDistance > threshold) {
        prevPhoto(); // Swipe right -> Prev
      }
    }
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
