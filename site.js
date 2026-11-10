(function () {
  var root = document.documentElement;
  root.classList.add('js-ready');

  var menuButton = document.querySelector('[data-menu-toggle]');
  var menu = document.getElementById('site-menu');
  var navigation = document.querySelector('.vr-nav');
  var mobileMenu = window.matchMedia('(max-width: 950px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var navigationActions = document.querySelector('.vr-nav-actions');
  if (navigationActions) {
    var languageSelect = document.createElement('select');
    languageSelect.className = 'vr-language-select';
    languageSelect.setAttribute('aria-label', 'Choose website language / Kies de taal van de website');
    [
      ['nl', '🇳🇱 NL'],
      ['en', '🇬🇧 EN']
    ].forEach(function (language) {
      var option = document.createElement('option');
      option.value = language[0];
      option.textContent = language[1];
      languageSelect.appendChild(option);
    });

    var languageStatus = document.createElement('span');
    languageStatus.className = 'vr-language-status';
    languageStatus.setAttribute('role', 'status');
    languageStatus.setAttribute('aria-live', 'polite');
    navigationActions.appendChild(languageStatus);

    var translateStarted = false;
    var translateHost;
    var requestedLanguage = 'nl';

    function currentLanguage() {
      var match = document.cookie.match(/(?:^|; )googtrans=\/nl\/([^;]+)/);
      return match && match[1] === 'en' ? 'en' : 'nl';
    }

    function setTranslatedLanguage(language) {
      languageSelect.value = language;
      var googleSelect = document.querySelector('.goog-te-combo');
      if (!googleSelect) return false;
      googleSelect.value = language === 'en' ? 'en' : '';
      googleSelect.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    function applyLanguageWhenReady(language, attempts) {
      if (language === 'en' && currentLanguage() === 'en') {
        languageStatus.textContent = '';
        return;
      }
      if (setTranslatedLanguage(language)) {
        if (language === 'en' && attempts > 0) {
          window.setTimeout(function () {
            applyLanguageWhenReady(language, attempts - 1);
          }, 300);
        } else if (language === 'nl' || currentLanguage() === 'en') {
          languageStatus.textContent = '';
        } else if (attempts > 0) {
          window.setTimeout(function () {
            applyLanguageWhenReady(language, attempts - 1);
          }, 300);
        } else {
          languageSelect.value = 'nl';
          languageStatus.textContent = 'English translation could not be loaded. Please try again later.';
          console.error('Google Translate did not apply the English translation.');
        }
        return;
      }
      if (attempts > 0) {
        window.setTimeout(function () {
          applyLanguageWhenReady(language, attempts - 1);
        }, 300);
      } else {
        languageSelect.value = 'nl';
        languageStatus.textContent = 'English translation could not be loaded. Please try again later.';
        console.error('Google Translate language selector was not created.');
      }
    }

    function loadTranslator(language) {
      requestedLanguage = language;
      if (translateStarted) {
        applyLanguageWhenReady(language, 50);
        return;
      }
      translateStarted = true;
      translateHost = document.createElement('span');
      translateHost.id = 'google_translate_element';
      translateHost.className = 'vr-translate-widget';
      translateHost.setAttribute('aria-hidden', 'true');
      document.body.appendChild(translateHost);

      window.googleTranslateElementInit = function () {
        if (!window.google || !window.google.translate) {
          translateStarted = false;
          translateHost.remove();
          languageSelect.value = 'nl';
          languageStatus.textContent = 'English translation could not be loaded. Please try again later.';
          console.error('Google Translate could not be initialized.');
          return;
        }
        new window.google.translate.TranslateElement({
          pageLanguage: 'nl',
          includedLanguages: 'en',
          autoDisplay: false
        }, 'google_translate_element');
        applyLanguageWhenReady(requestedLanguage, 50);
      };

      var translateScript = document.createElement('script');
      translateScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      translateScript.async = true;
      translateScript.onerror = function () {
        translateStarted = false;
        translateHost.remove();
        languageSelect.value = 'nl';
        languageStatus.textContent = 'English translation could not be loaded. Please try again later.';
        console.error('Google Translate script failed to load.');
      };
      document.head.appendChild(translateScript);
    }

    languageSelect.value = currentLanguage();
    languageSelect.addEventListener('change', function () {
      if (languageSelect.value === 'nl') {
        document.cookie = 'googtrans=/nl/nl; path=/; max-age=31536000; SameSite=Lax';
        if (window.location.hostname.indexOf('.') !== -1 &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1') {
          var cookieDomain = window.location.hostname.replace(/^www\./, '');
          document.cookie = 'googtrans=/nl/nl; path=/; max-age=31536000; SameSite=Lax; domain=.' + cookieDomain;
        }
        window.location.reload();
        return;
      }
      loadTranslator(languageSelect.value);
    });
    navigationActions.insertBefore(languageSelect, navigationActions.firstChild);
    navigationActions.insertBefore(languageStatus, languageSelect.nextSibling);
    if (languageSelect.value === 'en') loadTranslator('en');
  }

  if (navigation) {
    var scrollUpdatePending = false;
    function updateNavigationOnScroll() {
      if (scrollUpdatePending) return;
      scrollUpdatePending = true;
      window.requestAnimationFrame(function () {
        navigation.classList.toggle('is-scrolled', window.scrollY > 8);
        scrollUpdatePending = false;
      });
    }

    updateNavigationOnScroll();
    window.addEventListener('scroll', updateNavigationOnScroll, { passive: true });
  }

  if (menuButton && menu) {
    function setMenuOpen(open, returnFocus) {
      var isOpen = mobileMenu.matches && open;
      menu.dataset.menuOpen = String(isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Menu sluiten' : 'Menu openen');
      menu.inert = mobileMenu.matches && !isOpen;
      menu.setAttribute('aria-hidden', String(mobileMenu.matches && !isOpen));
      if (returnFocus) menuButton.focus();
    }

    setMenuOpen(false, false);

    menuButton.addEventListener('click', function () {
      setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true', false);
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenuOpen(false, false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false, true);
      }
    });

    document.addEventListener('click', function (event) {
      if (menuButton.getAttribute('aria-expanded') === 'true' &&
          !event.target.closest('.vr-nav')) {
        setMenuOpen(false, false);
      }
    });

    mobileMenu.addEventListener('change', function () {
      setMenuOpen(false, false);
    });
  }

  document.querySelectorAll('.vr-calc-stepper [data-step]').forEach(function (button) {
    button.addEventListener('click', function () {
      var input = button.parentElement.querySelector('input[type="number"]');
      if (!input) return;
      var min = input.min ? Number(input.min) : 1;
      var max = input.max ? Number(input.max) : 20;
      var value = Number(input.value) || min;
      input.value = String(Math.min(max, Math.max(min, value + Number(button.dataset.step))));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  var revealItems = document.querySelectorAll('[data-reveal]');
  if (!reduceMotion && 'IntersectionObserver' in window && revealItems.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        entry.target.removeAttribute('data-reveal-pending');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    revealItems.forEach(function (item) {
      var siblings = Array.prototype.filter.call(item.parentElement.children, function (sibling) {
        return sibling.hasAttribute('data-reveal');
      });
      var stagger = Math.min(siblings.indexOf(item) * 70, 280);
      if (stagger) item.style.transitionDelay = stagger + 'ms';
      item.setAttribute('data-reveal-pending', '');
      observer.observe(item);
    });
  }

  var home = document.querySelector('.vr-home[data-page="home"]');
  if (home) {
    var anchorLinks = Array.prototype.filter.call(home.querySelectorAll('a[href^="#"]'), function (link) {
      return !link.classList.contains('vr-skip-link') && home.querySelector(link.getAttribute('href'));
    });
    if ('IntersectionObserver' in window && anchorLinks.length) {
      var scrollSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var link = anchorLinks.find(function (anchor) {
            return anchor.getAttribute('href') === '#' + entry.target.id;
          });
          if (!link) return;
          if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
          else if (link.getAttribute('aria-current') === 'location') link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-64px 0px -70% 0px', threshold: 0 });

      anchorLinks.forEach(function (link) {
        scrollSpy.observe(home.querySelector(link.getAttribute('href')));
      });
    }

    var result = home.querySelector('#calc-result');
    if (result && 'MutationObserver' in window) {
      var countAnimationId = 0;
      var activeTotal = null;
      var resultObserver = new MutationObserver(function () {
        var total = result.querySelector('.vr-calc-total');
        if (total && total === activeTotal) return;
        if (!total) {
          countAnimationId += 1;
          activeTotal = null;
          result.classList.remove('is-updating');
          result.setAttribute('aria-live', 'polite');
          var previousAnnouncement = result.querySelector('.calc-total-announcement');
          if (previousAnnouncement) previousAnnouncement.remove();
          return;
        }

        var amount = Number(total.textContent.replace(/[^\d]/g, ''));
        if (!Number.isFinite(amount)) return;
        countAnimationId += 1;
        activeTotal = total;
        var currentAnimation = countAnimationId;
        var finalText = new Intl.NumberFormat('nl-NL', {
          style: 'currency', currency: 'EUR', maximumFractionDigits: 0
        }).format(amount);

        result.classList.add('is-updating');
        if (reduceMotion) {
          total.textContent = finalText;
          result.classList.remove('is-updating');
          return;
        }

        var announcement = result.querySelector('.calc-total-announcement');
        if (!announcement) {
          announcement = document.createElement('span');
          announcement.className = 'sr-only calc-total-announcement';
          result.appendChild(announcement);
        }
        result.setAttribute('aria-live', 'off');
        total.setAttribute('aria-hidden', 'true');

        var startTime;
        function countFrame(time) {
          if (currentAnimation !== countAnimationId || !total.isConnected) return;
          if (startTime === undefined) startTime = time;
          var progress = Math.min((time - startTime) / 360, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = Math.round(amount * eased);
          total.textContent = new Intl.NumberFormat('nl-NL', {
            style: 'currency', currency: 'EUR', maximumFractionDigits: 0
          }).format(current);

          if (progress < 1) {
            window.requestAnimationFrame(countFrame);
          } else {
            result.classList.remove('is-updating');
            result.setAttribute('aria-live', 'polite');
            announcement.textContent = 'Totaal: ' + finalText + '.';
          }
        }
        window.requestAnimationFrame(countFrame);
        window.requestAnimationFrame(function () {
          result.classList.remove('is-updating');
        });
      });
      resultObserver.observe(result, { childList: true });
    }
  }

  var faqAssistant = document.getElementById('faq-assistant-form');
  if (faqAssistant) {
    var faqInput = document.getElementById('faq-assistant-query');
    var faqResult = document.getElementById('faq-assistant-result');
    var faqStopWords = new Set([
      'de', 'het', 'een', 'en', 'of', 'voor', 'bij', 'met', 'wat', 'hoe',
      'wanneer', 'waar', 'mijn', 'ik', 'dan', 'als', 'van', 'je', 'is',
      'kan', 'dit', 'die', 'op', 'in', 'tot', 'dat', 'wel', 'per', 'naar',
      'aan', 'geen', 'niet', 'heb', 'heeft', 'zijn', 'wordt', 'worden',
      'wil', 'krijg', 'krijgen', 'moet', 'moeten', 'er', 'me', 'we'
    ]);

    function normalizeFaqText(value) {
      return value.toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    }

    function makeFaqLink(href, label) {
      var link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      return link;
    }

    var faqEntries = Array.prototype.map.call(
      document.querySelectorAll('.vr-faq-category details'),
      function (details, index) {
        var id = 'faq-antwoord-' + (index + 1);
        details.id = id;
        var question = details.querySelector('summary').textContent.trim();
        var answer = Array.prototype.map.call(details.querySelectorAll('p'), function (paragraph) {
          return paragraph.textContent.trim();
        }).join(' ');
        return {
          id: id,
          question: question,
          answer: answer,
          normalizedQuestion: normalizeFaqText(question),
          normalizedAnswer: normalizeFaqText(answer)
        };
      }
    );

    faqAssistant.addEventListener('submit', function (event) {
      event.preventDefault();
      var query = faqInput.value.trim();
      var normalizedQuery = normalizeFaqText(query);
      var terms = normalizedQuery.split(/\s+/).filter(function (term) {
        return term.length > 1 && !faqStopWords.has(term);
      });

      faqResult.replaceChildren();
      if (!query || !terms.length) {
        var prompt = document.createElement('p');
        prompt.textContent = 'Vul een vraag met een paar inhoudelijke woorden in, bijvoorbeeld “compensatie bij annulering”.';
        faqResult.appendChild(prompt);
        faqResult.focus();
        return;
      }

      var matches = faqEntries.map(function (entry) {
        var score = 0;
        var matchedTerms = 0;
        terms.forEach(function (term) {
          var inQuestion = entry.normalizedQuestion.indexOf(term) !== -1;
          var inAnswer = entry.normalizedAnswer.indexOf(term) !== -1;
          if (inQuestion || inAnswer) matchedTerms += 1;
          if (inQuestion) score += 3;
          if (inAnswer) score += 1;
        });
        if (entry.normalizedQuestion.indexOf(normalizedQuery) !== -1) score += 5;
        return { entry: entry, score: score, coverage: matchedTerms / terms.length };
      }).filter(function (match) {
        return match.score > 0 && match.coverage >= 0.4;
      }).sort(function (a, b) {
        return b.score - a.score;
      });

      if (matches.length) {
        var best = matches[0].entry;
        var heading = document.createElement('h3');
        heading.textContent = best.question;
        var answer = document.createElement('p');
        answer.textContent = best.answer;
        var faqLink = makeFaqLink('#' + best.id, 'Bekijk dit antwoord in de FAQ');
        faqLink.setAttribute('data-open-faq', best.id);
        faqResult.append(heading, answer, faqLink);
      } else {
        var noMatch = document.createElement('p');
        noMatch.textContent = 'Ik vind geen duidelijk passend antwoord in de FAQ. Je kunt zelf verder zoeken; je vraag wordt pas gedeeld als je een zoeklink opent.';
        var searchLinks = document.createElement('div');
        searchLinks.className = 'vr-faq-assistant-search-links';
        var googleQuery = encodeURIComponent(query + ' EU261 passagiersrechten');
        var webSearchLink = makeFaqLink('https://www.google.com/search?q=' + googleQuery, 'Zoek op internet');
        webSearchLink.target = '_blank';
        webSearchLink.rel = 'noopener noreferrer';
        searchLinks.append(
          webSearchLink,
          makeFaqLink('https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_nl.htm', 'Bekijk Your Europe')
        );
        faqResult.append(noMatch, searchLinks);
      }
      faqResult.focus();
    });

    faqResult.addEventListener('click', function (event) {
      var link = event.target.closest('[data-open-faq]');
      if (!link) return;
      var details = document.getElementById(link.dataset.openFaq);
      if (details) details.open = true;
    });
  }
})();
