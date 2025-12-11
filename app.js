/*
  Konfiguracja odsłaniania sesji (per prelegent) – EDYTUJ TYLKO TEN BLOK:
  - Klucz: dokładna nazwa z karty (speaker-info h4)
  - Wartość: true = pokaż sesję (hidden = false), false = ukryj (hidden = true)
  - Przykład edycji: assignments["Prof. Ulrich Giese"] = true;
  Dzięki temu zmieniasz wyłącznie tę mapę, bez dotykania HTML/CSS.
*/
const assignments = {
  "Prof. Jacques Noordermeer": false,
  "Prof. Anke Blume": false,
  "Prof. James Busfield": false,
  "Prof. Ulrich Giese": true,
  "Prof. Maurizio Galimberti": false,
  "Prof. Ivan Hudec": false,
  "Prof. Zbigniew Florjańczyk": false,
  "Prof. Jananina da Silva Crespo": false,
  "Prof. Marly Jacobi": false,
  "Prof. Wirasak Smitthipong": false
};

/*
  Funkcja stosująca konfigurację assignments:
  - Dla każdej karty prelegenta pobiera nazwę (h4)
  - Znajduje element .speaker-session
  - Ustawia sessionEl.hidden odwrotnie do assignments[name]:
      - assignments[name] === true  -> sessionEl.hidden = false (pokaż)
      - assignments[name] === false -> sessionEl.hidden = true (ukryj)
  Uwaga: Jeśli prelegenta nie ma w assignments, nie zmieniamy jego stanu (zostaje jak w HTML).
*/
function applySessionAssignments() {
  document.querySelectorAll('.speaker-card').forEach(card => {
    const name = card.querySelector('.speaker-info h4')?.textContent?.trim();
    const sessionEl = card.querySelector('.speaker-session');
    if (!name || !sessionEl) return;
    if (Object.prototype.hasOwnProperty.call(assignments, name)) {
      sessionEl.hidden = !assignments[name];
    }
  });
}

/** Mapowanie nazw krajów -> kod ISO 3166-1 alpha-2 (dla SVG z CDN) */
const countryToIso = {
    // Europa
    'holandia': 'nl', 'netherlands': 'nl', 'the netherlands': 'nl',
    'wielka brytania': 'gb', 'uk': 'gb', 'united kingdom': 'gb', 'great britain': 'gb', 'england': 'gb',
    'niemcy': 'de', 'germany': 'de',
    'włochy': 'it', 'wlochy': 'it', 'italy': 'it',
    'słowacja': 'sk', 'slowacja': 'sk', 'slovakia': 'sk',
    'polska': 'pl', 'poland': 'pl',
    // Ameryka Płd.
    'brazylia': 'br', 'brazil': 'br',
    // Azja
    'tajlandia': 'th', 'thailand': 'th'
};

/** Heurystyki rozpoznawania kraju z treści opisu uczelni/afiliacji */
function detectCountryIso(text) {
    if (!text) return null;
    const t = text.toLowerCase();

    // 0) Specjalne bezpieczeństwo: DIK (Giese) – zawsze DE
    if (
        t.includes('deutsches institut für kautschuktechnologie') ||
        t.includes('deutsches institut fur kautschuktechnologie') ||
        t.includes('dik')
    ) {
        return 'de';
    }

    // 1) Najpierw jawne nazwy krajów (PL/EN)
    for (const key in countryToIso) {
        if (t.includes(key)) {
            return countryToIso[key];
        }
    }

    // 2) Heurystyki po nazwach uczelni/instytucji
    if (t.includes('queen mary university of london')) return 'gb';
    if (t.includes('university of twente')) return 'nl';
    if (t.includes('politecnico di milano')) return 'it';
    if (t.includes('slovak university of technology')) return 'sk';
    if (t.includes('kasetsart university')) return 'th';
    if (t.includes('ucs') || t.includes('porto alegre')) return 'br';
    if (t.includes('politechnika warszawska') || t.includes('warsaw university of technology')) return 'pl';

    return null;
}

/** Zamiana zdjęć prelegentów na flagi SVG (CDN) w karuzeli */
function replaceSpeakerImagesWithFlags() {
    const cards = document.querySelectorAll('.speaker-card');
    cards.forEach(card => {
        const avatar = card.querySelector('.speaker-avatar');
        const affiliationEl = card.querySelector('.speaker-info p');
        if (!avatar || !affiliationEl) return;

        // Pobierz tekst bazowy w aktualnym języku (preferuj data-XX gdy istnieje)
        const currentLang = document.documentElement.lang || 'pl';
        const dataAttr = affiliationEl.getAttribute(`data-${currentLang}`);
        const text = (dataAttr && dataAttr.trim().length > 0) ? dataAttr : (affiliationEl.textContent || '');

        const iso = detectCountryIso(text);
        if (!iso) return; // jeśli nie wykryto kraju, pozostaw obraz jak jest

        // Źródła CDN flag (SVG). Możesz wybrać jedno z poniższych:
        // 1) flagcdn.com: https://flagcdn.com/w160/{iso}.png (PNG) lub /{iso}.svg (SVG)
        // 2) jsDelivr + lipis/flag-icons: https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/{iso}.svg
        const flagSrc = `https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${iso}.svg`;

        // Wyczyść zawartość avatara i wstaw SVG jako <img>
        avatar.innerHTML = '';
        const img = document.createElement('img');
        img.src = flagSrc;
        img.alt = `Flaga kraju prelegenta (${iso.toUpperCase()})`;
        img.width = 150;  // dopasowane do kontenera
        img.height = 100; // proporcje 4:3 w polu 150x150
        img.style.objectFit = 'contain';
        img.loading = 'lazy';
        img.decoding = 'async';
        avatar.appendChild(img);
    });
}

// DOM Elements
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const navbar = document.getElementById('navbar');
const langButtons = document.querySelectorAll('.lang-btn');
const navLinks = document.querySelectorAll('.nav-link');
const scrollLinks = document.querySelectorAll('a[href^="#"]');

let typingInterval = null; // To manage the typewriter animation interval

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Set initial language to Polish FIRST to ensure correct layout before AOS init
        setLanguage('pl');
        // Po ustawieniu języka podmień zdjęcia na flagi (CDN SVG)
        replaceSpeakerImagesWithFlags();
        // Zastosuj konfigurację widoczności sesji (ukryj/pokaż wg assignments)
        applySessionAssignments();

        initContrastToggle();
        initNavigation();
        initLanguageSwitch();
        // Na wszelki wypadek – po inicjalizacjach które modyfikują DOM
        replaceSpeakerImagesWithFlags();
        adjustLayoutForNavbar(); // Adjust layout based on dynamic navbar height
        initScrollEffects();
        initCountdown();
        initCountUp();
        initProgramTabs();
        initSpeakerCarousel(); /* Initialize the new speaker carousel */

    // Po inicjalizacji karuzeli ponownie nałóż konfigurację (na wypadek re-renderów / klonów)
    document.querySelectorAll('.speaker-session').forEach(el => { el.hidden = true; });
    if (typeof applySessionAssignments === 'function') applySessionAssignments();
    if (typeof applySectionVisibility === 'function') applySectionVisibility();

    AOS.init({
            duration: 800,
            once: true,
            offset: 50,
            threshold: 0.05
        });

        initAccessibility();
        initSpeakerFlipAccessibility(); // Ujednolicona funkcja dostępności kart

        // Adjust layout on window resize
        window.addEventListener('resize', debounce(adjustLayoutForNavbar, 100));
    });

/**
 * Accessibility for flip cards (keyboard + ARIA)
 * Uwaga: Definiujemy PRZED initNavigation/DOMContentLoaded, aby funkcja istniała
 * zanim zostanie wywołana przy starcie.
 */
function initSpeakerFlipAccessibility() {
    const flipCards = document.querySelectorAll('.speaker-card.flip-card');

    flipCards.forEach(card => {
        const front = card.querySelector('.flip-card-front');
        const back = card.querySelector('.flip-card-back');
        const speakerName = card.querySelector('.speaker-info h4')?.textContent?.trim();

        if (!front || !back) return; // Skip if card structure is incomplete

        // --- ARIA Setup ---
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-pressed', 'false');

        // Dynamic, more descriptive aria-label
        if (speakerName) {
            const baseLabel = card.getAttribute('data-pl-label') || 'Pokaż biogram:';
            card.setAttribute('aria-label', `${baseLabel} ${speakerName}`);
        }

        front.setAttribute('aria-hidden', 'false');
        back.setAttribute('aria-hidden', 'true');

        // --- Helper function to set flip state ---
        const setFlipped = (isFlipped) => {
            card.setAttribute('aria-pressed', isFlipped);
            front.setAttribute('aria-hidden', isFlipped);
            back.setAttribute('aria-hidden', !isFlipped);
        };

        // --- Event Listeners ---
        card.addEventListener('click', (e) => {
            if (e.target.closest && e.target.closest('.speaker-more')) return;
            const isPressed = card.getAttribute('aria-pressed') === 'true';
            setFlipped(!isPressed);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isPressed = card.getAttribute('aria-pressed') === 'true';
                setFlipped(!isPressed);
            } else if (e.key === 'Escape') {
                setFlipped(false);
            }
        });

        card.addEventListener('focusout', (e) => {
            if (!card.contains(e.relatedTarget)) {
                setFlipped(false);
            }
        });
    });
}

// Navigation
function initNavigation() {
    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', !isExpanded);
    });

    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Active section highlighting
    window.addEventListener('scroll', () => {
        // Pobieraj tylko widoczne sekcje, aby uniknąć błędów w obliczeniach offsetu
        const sections = document.querySelectorAll('section[id]:not([hidden])');
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Użyj getBoundingClientRect().height zamiast clientHeight dla dokładniejszego pomiaru
            const sectionHeight = section.getBoundingClientRect().height;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/* WIDOCZNOŚĆ SEKCJI – FUNKCJE POMOCNICZE (zdefiniowane przed użyciem) */
function applySectionVisibility() {
  // Mapowanie kluczy -> id sekcji
  const map = [
    { key: 'speakers', id: 'speakers' },
    { key: 'program', id: 'program' },
    { key: 'registration', id: 'registration' },
    { key: 'documents', id: 'documents' },
    { key: 'venue', id: 'venue' }
  ];

  // Jeżeli nie ma globalnej konfiguracji, ustaw widoczność domyślną (true)
  if (typeof window.sectionsVisible === 'undefined') {
    window.sectionsVisible = {
      speakers: true,
      program: true,
      registration: true,
      documents: true,
      partners_list: true,
      partners_packages: true,
      venue: true
    };
  }

  // 1) Całe sekcje + odpowiadające pozycje menu
  map.forEach(({ key, id }) => {
    const visible = !!window.sectionsVisible[key];
    const el = document.getElementById(id);
    if (el) el.hidden = !visible;
    document.querySelectorAll(`.nav-link[href="#${id}"]`).forEach(link => {
      const li = link.closest('li');
      if (li) li.hidden = !visible; else link.hidden = !visible;
    });
  });

  // 2) Partnerzy: rozdzielone podsekcje w #partners
  const partnersSection = document.getElementById('partners');
  if (partnersSection) {
    // 2a) Lista partnerów – ukryj CAŁĄ sekcję kategorii (nagłówek + logotypy)
    //     czyli wszystkie .partner-category ORAZ .partners-grid, gdy partners_list = false.
    const listVisible = !!window.sectionsVisible.partners_list;

    // Ukryj/pokaż każdy blok kategorii partnerów (zawiera nagłówek i logotypy)
    partnersSection.querySelectorAll('.partner-category').forEach(cat => {
      cat.hidden = !listVisible;
    });

    // Dodatkowo, jako zabezpieczenie, schowaj same kontenery gridów (jeśli istnieją osobno)
    partnersSection.querySelectorAll('.partners-grid').forEach(grid => {
      grid.hidden = !listVisible;
    });

    // 2b) Pakiety sponsorskie – osobny blok
    const partnersPackages = partnersSection.querySelector('.sponsorship-packages');
    if (partnersPackages) partnersPackages.hidden = !window.sectionsVisible.partners_packages;

    // 2c) Jeśli obie podsekcje są ukryte, ukryj cały #partners i link w menu
    const anyPartnersVisible = listVisible || (!!window.sectionsVisible.partners_packages);
    partnersSection.hidden = !anyPartnersVisible;
    document.querySelectorAll(`.nav-link[href="#partners"]`).forEach(link => {
      const li = link.closest('li');
      if (li) li.hidden = !anyPartnersVisible; else link.hidden = !anyPartnersVisible;
    });
  }
}

// Language switching
function initLanguageSwitch() {
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);

            // Update active state
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setLanguage(lang) {
    const elements = document.querySelectorAll('[data-en][data-pl]');
    elements.forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (!text) return; // Skip if no text for the current language

        if (el.id === 'animated-title') {
            // Apply typewriter effect for the main title
            typewriterEffect(el, text);
        } else {
            // Use innerHTML for elements that may contain <br> tags
            if (el.tagName === 'P' || el.tagName === 'A' || el.tagName === 'SPAN' || el.tagName === 'DIV') {
                el.innerHTML = text;
            } else {
                el.textContent = text;
            }
        }
    });

    // Update image sources
    const images = document.querySelectorAll('img[data-pl-src][data-en-src]');
    images.forEach(img => {
        const src = img.getAttribute(`data-${lang}-src`);
        if (src) {
            img.src = src;
        }
    });

    // Update form labels
    const formLabels = document.querySelectorAll('label[data-en][data-pl]');
    formLabels.forEach(label => {
        label.textContent = label.getAttribute(`data-${lang}`);
    });

    // Update button texts
    const buttons = document.querySelectorAll('button[data-en][data-pl]');
    buttons.forEach(btn => {
        btn.textContent = btn.getAttribute(`data-${lang}`);
    });

    // Update document descriptions
    const docDescriptions = document.querySelectorAll('.document-description');
    docDescriptions.forEach(desc => {
        desc.style.display = desc.getAttribute('data-lang') === lang ? 'block' : 'none';
    });

    // Update document items
    const documentItems = document.querySelectorAll('.document-item');
    documentItems.forEach(item => {
        const itemLang = item.getAttribute('data-lang');
        if (itemLang) {
            item.style.display = itemLang === lang ? 'flex' : 'none';
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Po zmianie języka – ponownie zastosuj flagi (bo tekst afiliacji mógł się zmienić)
    replaceSpeakerImagesWithFlags();

    // Po zmianie języka nie ruszamy assignments – sterowanie sesjami pozostaje jak w konfiguracji
    document.querySelectorAll('.speaker-session').forEach(el => { el.hidden = true; });
    if (typeof applySessionAssignments === 'function') applySessionAssignments();

    // Widoczność sekcji i menu pozostaje wg sectionsVisible – ponów dla pewności
    if (typeof applySectionVisibility === 'function') applySectionVisibility();

    // Update contrast toggle labels
    const contrastToggles = document.querySelectorAll('.contrast-toggle');
    contrastToggles.forEach(btn => {
        const label = btn.getAttribute(`data-${lang}-label`);
        if (label) {
            btn.setAttribute('aria-label', label);
        }
        const textSpan = btn.querySelector('span');
        if (textSpan) {
            textSpan.textContent = textSpan.getAttribute(`data-${lang}`);
        }
    });

    // Update href for sponsorship CTA button
    const sponsorshipCtaButton = document.querySelector('.sponsorship-cta .cta-button');
    if (sponsorshipCtaButton) {
        const href = sponsorshipCtaButton.getAttribute(`data-${lang}-href`);
        if (href) {
            sponsorshipCtaButton.href = href;
        }
    }
}

// Speaker Carousel
function initSpeakerCarousel() {
    const carouselTrack = document.querySelector('.carousel-track');
    const speakerCards = Array.from(document.querySelectorAll('.speaker-card'));
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    const paginationContainer = document.querySelector('.carousel-pagination');

    if (!carouselTrack || speakerCards.length === 0) {
        console.warn('Carousel elements not found. Skipping carousel initialization.');
        return;
    }

    // --- Accessibility: Add aria-controls to buttons ---
    const trackId = carouselTrack.id;
    if (trackId) {
        if (prevButton) prevButton.setAttribute('aria-controls', trackId);
        if (nextButton) nextButton.setAttribute('aria-controls', trackId);
    }
    let cardWidth; // Szerokość karty + odstęp
    let autoScrollInterval;
    let currentCardIndex = 0; // Indeks aktualnie wyświetlanej karty (logiczny, nie fizyczny)
    let isPaused = false;
    let originalSpeakerCards = []; // Oryginalne karty prelegentów
    let clonedSpeakerCards = []; // Sklonowane karty dla nieskończonej pętli
    let totalVisibleCards = 0; // Liczba kart widocznych jednocześnie

    // Funkcja do duplikowania kart dla efektu nieskończonej pętli
    const duplicateCards = () => {
        originalSpeakerCards = Array.from(document.querySelectorAll('.speaker-card'));
        // Usuń istniejące klony, aby uniknąć duplikacji przy ponownym wywołaniu
        carouselTrack.querySelectorAll('.cloned').forEach(clone => clone.remove());

        // Klonuj karty i dodaj je na koniec, aby stworzyć płynną pętlę
        // Klonujemy dwukrotnie, aby zapewnić wystarczającą liczbę kart do płynnego przewijania
        originalSpeakerCards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.classList.add('cloned');
            carouselTrack.appendChild(clone);
        });
        originalSpeakerCards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.classList.add('cloned');
            carouselTrack.appendChild(clone);
        });
        clonedSpeakerCards = Array.from(carouselTrack.querySelectorAll('.speaker-card.cloned'));
    };

    // Funkcja do aktualizacji wymiarów karuzeli i liczby widocznych kart
    const updateCarouselDimensions = () => {
        if (originalSpeakerCards.length === 0) return;

        // Upewnij się, że cardWidth jest aktualizowany na podstawie rzeczywistych wymiarów
        // Pobierz pierwszą kartę (oryginalną) i jej styl obliczony
        const firstCard = originalSpeakerCards[0];
        const computedStyle = window.getComputedStyle(firstCard);
        const cardMarginRight = parseFloat(computedStyle.marginRight); // Jeśli gap jest ustawiony jako margin-right
        const cardPaddingLeft = parseFloat(computedStyle.paddingLeft);
        const cardPaddingRight = parseFloat(computedStyle.paddingRight);

        // Jeśli gap jest ustawiony na flexbox gap, to nie będzie margin-right
        const gap = parseFloat(window.getComputedStyle(carouselTrack).gap);
        cardWidth = firstCard.offsetWidth + (isNaN(gap) ? 0 : gap); // Szerokość karty + odstęp

        const trackContainerWidth = carouselTrack.parentElement.offsetWidth;
        totalVisibleCards = Math.floor(trackContainerWidth / cardWidth);

        // Upewnij się, że currentCardIndex jest w prawidłowym zakresie
        currentCardIndex = Math.max(0, Math.min(currentCardIndex, originalSpeakerCards.length - 1));
        scrollToCard(currentCardIndex, false); // Przewiń do aktualnej karty bez animacji
        updatePagination();
    };

    // Funkcja do przewijania do konkretnej karty
    const scrollToCard = (index, smooth = true) => {
        const targetScrollPosition = index * cardWidth;
        if (!smooth) {
            carouselTrack.style.transition = 'none';
        } else {
            carouselTrack.style.transition = 'transform 0.5s ease-in-out';
        }
        carouselTrack.style.transform = `translateX(-${targetScrollPosition}px)`;
        currentCardIndex = index;

        if (!smooth) {
            // Wymuś reflow, aby natychmiast zastosować zmianę bez przejścia
            carouselTrack.offsetHeight;
            carouselTrack.style.transition = 'transform 0.5s ease-in-out';
        }
        updatePagination();
    };

    // Automatyczne przewijanie
    const startAutoScroll = () => {
        if (autoScrollInterval) clearInterval(autoScrollInterval);
        autoScrollInterval = setInterval(() => {
            if (isPaused) return;

            currentCardIndex++;
            // Jeśli przekroczymy liczbę oryginalnych kart, przeskocz do początku
            if (currentCardIndex >= originalSpeakerCards.length) {
                // Natychmiast przeskocz do początku sklonowanych kart (które są identyczne z oryginalnymi)
                carouselTrack.style.transition = 'none';
                currentCardIndex = 0; // Resetuj indeks do początku oryginalnych kart
                carouselTrack.style.transform = `translateX(-${currentCardIndex * cardWidth}px)`;
                carouselTrack.offsetHeight; // Wymuś reflow
                carouselTrack.style.transition = 'transform 0.5s ease-in-out'; // Przywróć płynne przejście
            }
            scrollToCard(currentCardIndex);
        }, 3000); // Przewijaj co 3 sekundy
    };

    const stopAutoScroll = () => {
        clearInterval(autoScrollInterval);
    };

    const pauseCarousel = () => {
        isPaused = true;
        stopAutoScroll();
    };

    const resumeCarousel = () => {
        isPaused = false;
        startAutoScroll();
    };

    // Ręczne przewijanie
    const manualScroll = (direction) => {
        pauseCarousel(); // Wstrzymaj automatyczne przewijanie
        if (direction === 'next') {
            currentCardIndex = (currentCardIndex + 1) % originalSpeakerCards.length;
        } else {
            currentCardIndex = (currentCardIndex - 1 + originalSpeakerCards.length) % originalSpeakerCards.length;
        }
        scrollToCard(currentCardIndex);
        // Wznów automatyczne przewijanie po krótkiej przerwie
        setTimeout(resumeCarousel, 1000);
    };

    prevButton.addEventListener('click', () => manualScroll('prev'));
    nextButton.addEventListener('click', () => manualScroll('next'));

    // Paginacja
    const updatePagination = () => {
        paginationContainer.innerHTML = '';
        const numDots = originalSpeakerCards.length; // Jedna kropka na każdą oryginalną kartę

        for (let i = 0; i < numDots; i++) {
            const dot = document.createElement('button');
            dot.classList.add('pagination-dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-controls', `speaker-panel-${i}`);
            dot.setAttribute('aria-label', `Przejdź do prelegenta ${i + 1}`);
            dot.setAttribute('data-pl-label', `Przejdź do prelegenta ${i + 1}`);
            dot.setAttribute('data-en-label', `Go to speaker ${i + 1}`);
            dot.setAttribute('data-index', i);

            if (i === currentCardIndex) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.setAttribute('aria-selected', 'false');
            }
            paginationContainer.appendChild(dot);
        }
        // Re-apply language for new pagination dots
        // setLanguage(document.documentElement.lang || 'pl'); // Usunięto, aby uniknąć resetowania animacji typewriter
        // Zamiast tego, ręcznie zaktualizuj etykiety dla nowo utworzonych kropek
        const currentLang = document.documentElement.lang || 'pl';
        paginationContainer.querySelectorAll('.pagination-dot').forEach(dot => {
            const label = dot.getAttribute(`data-${currentLang}-label`);
            if (label) {
                dot.setAttribute('aria-label', label);
            }
        });
    };

    paginationContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('pagination-dot')) {
            pauseCarousel();
            const index = parseInt(e.target.getAttribute('data-index'));
            scrollToCard(index);
            setTimeout(resumeCarousel, 1000);
        }
    });

    // Keyboard navigation for carousel buttons
    prevButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            manualScroll('prev');
        }
    });

    nextButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            manualScroll('next');
        }
    });

    // Keyboard navigation for pagination dots
    paginationContainer.addEventListener('keydown', (e) => {
        const activeDot = paginationContainer.querySelector('.pagination-dot.active');
        if (!activeDot) return;

        const dots = Array.from(paginationContainer.querySelectorAll('.pagination-dot'));
        const currentIndex = dots.indexOf(activeDot);

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % dots.length;
            dots[nextIndex].click();
            dots[nextIndex].focus();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const nextIndex = (currentIndex - 1 + dots.length) % dots.length;
            dots[nextIndex].click();
            dots[nextIndex].focus();
        }
    });

    // Pause on hover/focus
    const carouselContainer = document.querySelector('.carousel-container');
    carouselContainer.addEventListener('mouseenter', pauseCarousel);
    carouselContainer.addEventListener('mouseleave', resumeCarousel);
    carouselContainer.addEventListener('focusin', pauseCarousel);
    carouselContainer.addEventListener('focusout', resumeCarousel);

    // Initial setup
    duplicateCards();
    updateCarouselDimensions();
    startAutoScroll();

    // Update on window resize
    window.addEventListener('resize', debounce(updateCarouselDimensions, 250));
}

/* Stylizacja flag – dopasowanie w CSS przez klasę .flag-emoji
   Uwaga: CSS w style.css nie zna jeszcze .flag-emoji, ale używamy istniejącego
   kontenera .speaker-avatar (150x150), więc emoji skalujemy font-size inline
   przez CSS klasy. */

/* Typewriter effect for the hero title */
function typewriterEffect(element, text, speed = 100) {
    // Clear any ongoing animation to prevent conflicts when switching languages
    if (typingInterval) {
        clearInterval(typingInterval);
    }

    // Ensure the typewriter class is present for the blinking animation
    element.classList.add('typewriter');
    element.innerHTML = ''; // Start with empty text
    element.style.borderRight = '3px solid #44d62c'; // Ensure cursor is visible
    let i = 0;

    typingInterval = setInterval(() => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(typingInterval);
            typingInterval = null;
            // Stop the blinking cursor by removing the class and the border
            element.classList.remove('typewriter');
            element.style.borderRight = 'none';
        }
    }, speed);
}

// Smooth scrolling
function initScrollEffects() {
    scrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Countdown timer
function initCountdown() {
    const targetDate = new Date('2026-05-27T09:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            document.getElementById('days').textContent = '000';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days.toString().padStart(3, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Count up animation for statistics
function initCountUp() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const count = parseInt(target.getAttribute('data-count'));
                animateCountUp(target, count);
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCountUp(element, target) {
    let current = 0;
    const increment = target / 50;
    const addPlus = element.getAttribute('data-plus') === 'true';
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + (addPlus ? '+' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// Program tabs functionality
function initProgramTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const programDays = document.querySelectorAll('.program-day');
    const tabList = document.querySelector('.program-tabs');

    function activateTab(tabToActivate, setFocus = false) {
        // Deactivate all tabs and panels
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');
        });
        programDays.forEach(day => {
            day.classList.remove('active');
        });

        // Activate the target tab and its corresponding panel
        tabToActivate.classList.add('active');
        tabToActivate.setAttribute('aria-selected', 'true');
        tabToActivate.setAttribute('tabindex', '0');

        const targetDay = tabToActivate.getAttribute('data-day');
        const targetContent = document.querySelector(`.program-day[data-day="${targetDay}"]`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        if (setFocus) {
            tabToActivate.focus();
        }
    }

    tabButtons.forEach((button) => {
        // Set initial state based on HTML
        if (button.classList.contains('active')) {
            button.setAttribute('tabindex', '0');
        } else {
            button.setAttribute('tabindex', '-1');
        }

        button.addEventListener('click', (e) => {
            activateTab(e.currentTarget);
        });
    });

    tabList.addEventListener('keydown', (e) => {
        const currentIndex = Array.from(tabButtons).indexOf(document.activeElement);
        if (currentIndex === -1) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % tabButtons.length;
            activateTab(tabButtons[nextIndex], true);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
            activateTab(tabButtons[nextIndex], true);
        }
    });
}



// Accessibility improvements
function initAccessibility() {
    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#about'; // Lepszy cel: pierwsza sekcja z treścią
    skipLink.textContent = 'Przejdź do głównej treści';
    skipLink.className = 'skip-link';

    document.body.insertBefore(skipLink, document.body.firstChild);
}

// High Contrast Mode Toggle
function initContrastToggle() {
    const contrastToggles = document.querySelectorAll('.contrast-toggle');
    const htmlElement = document.documentElement;

    const applyContrast = (isHighContrast) => {
        if (isHighContrast) {
            htmlElement.classList.add('high-contrast');
        } else {
            htmlElement.classList.remove('high-contrast');
        }
    };

    // Check for a saved user preference first
    const savedPreference = localStorage.getItem('highContrast');

    if (savedPreference !== null) {
        // If user has made a choice, respect it
        applyContrast(savedPreference === 'true');
    } else {
        // If no choice was made, check system preferences
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

        if (prefersDark || prefersHighContrast) {
            applyContrast(true);
        }
    }

    contrastToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            // When user clicks, this is an explicit choice, so we save it
            const isEnabled = htmlElement.classList.toggle('high-contrast');
            localStorage.setItem('highContrast', isEnabled);
        });
    });
}

/**
 * Adjusts layout elements based on the dynamic height of the fixed navbar.
 * This prevents the navbar from overlapping content below it.
 */
function adjustLayoutForNavbar() {
    const navbar = document.getElementById('navbar');
    const logoBar = document.querySelector('.logo-bar');
    const hero = document.querySelector('.hero');

    if (!navbar || !logoBar || !hero) {
        return;
    }

    const navbarHeight = navbar.offsetHeight;
    logoBar.style.marginTop = `${navbarHeight}px`;

    // On desktop, calculate the total offset to adjust the hero section's height.
    if (window.innerWidth > 992) {
        const logoBarHeight = logoBar.offsetHeight;
        const totalOffset = navbarHeight + logoBarHeight;
        hero.style.minHeight = `calc(100vh - ${totalOffset}px)`;
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance optimization
const debouncedScroll = debounce(() => {
    // Scroll-based animations
}, 16);

window.addEventListener('scroll', debouncedScroll);

// Error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});
