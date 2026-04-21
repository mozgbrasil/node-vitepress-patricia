// https://platform.linkedin.com/badges/js/profile.js

(function (window) {
  const CALLBACK_NAME = 'LIBadgeCallback';
  const BADGE_NAMES = '.LI-profile-badge, .LI-entity-badge';
  const TRACKING_PARAM = 'profile-badge';

  let responsesReceived = 0;
  let expectedResponses = 0;
  let scripts = [];
  let childScripts = {};
  let badges = [];

  function isCNDomain() {
    if (typeof window !== 'undefined') {
      const hostName = (window.location && window.location.hostname) || '';
      return /linkedin(-ei)?.cn$/.test(hostName);
    }
    return false;
  }

  function generateUrl(isEI) {
    const domainPrefix = isEI
      ? 'https://badges.linkedin-ei'
      : 'https://badges.linkedin';
    return isCNDomain() ? `${domainPrefix}.cn/` : `${domainPrefix}.com/`;
  }

  function getBadgeKeyQueryParams(badge) {
    return Array.prototype.slice
      .call(badge.attributes)
      .filter((attr) => attr.name.lastIndexOf('data-key-', 0) !== -1)
      .map(
        (attr) =>
          encodeURIComponent(attr.name.replace('data-', '').toLowerCase()) +
          '=' +
          encodeURIComponent(attr.value),
      );
  }

  function renderBadge(badge) {
    let size = badge.getAttribute('data-size');
    let locale = badge.getAttribute('data-locale');
    let type = badge.getAttribute('data-type');
    let theme = badge.getAttribute('data-theme');
    let vanity = badge.getAttribute('data-vanity');
    let version = badge.getAttribute('data-version');
    let isEI = badge.hasAttribute('data-ei');
    let entity = badge.getAttribute('data-entity');
    let isCreatePage = badge.hasAttribute('data-iscreate');
    let uid = Math.round(1000000 * Math.random());
    let baseUrl = generateUrl(isEI);
    let queryParams = [
      `locale=${encodeURIComponent(locale)}`,
      `badgetype=${encodeURIComponent(type)}`,
      `badgetheme=${encodeURIComponent(theme)}`,
      `uid=${encodeURIComponent(uid)}`,
      `version=${encodeURIComponent(version)}`,
    ];

    if (version === 'v2') {
      baseUrl += 'view';
      queryParams.push(`badgesize=${encodeURIComponent(size)}`);
      queryParams.push(`entity=${encodeURIComponent(entity)}`);
      queryParams = queryParams.concat(getBadgeKeyQueryParams(badge));
    } else {
      baseUrl += 'profile';
      queryParams.push(`maxsize=${encodeURIComponent(size)}`);
      queryParams.push(`trk=${encodeURIComponent(TRACKING_PARAM)}`);
      queryParams.push(`vanityname=${encodeURIComponent(vanity)}`);
    }

    if (isCreatePage) {
      queryParams.push('fromCreate=true');
    }

    const url = `${baseUrl}?${queryParams.join('&')}`;
    badge.setAttribute('data-uid', uid);

    // jsonp(url) // Faz a requisição JSONP
  }

  function responseHandler(badgeHtml, badgeUid) {
    responsesReceived++;

    const defaultWidth = 330;
    const defaultHeight = 300;

    badges.forEach((badge) => {
      const isCreate = badge.getAttribute('data-iscreate');
      const uid = parseInt(badge.getAttribute('data-uid'), 10);
      // if (uid === badgeUid) {
      const badgeMarkup = `<body>${badgeHtml}</body>`;
      const iframe = document.createElement('iframe');
      iframe.onload = function () {
        const iframeBody = iframe.contentWindow.document.body;
        iframe.setAttribute(
          'height',
          (iframeBody.scrollHeight || defaultHeight) + 5,
        );
        iframe.setAttribute(
          'width',
          (iframeBody.scrollWidth || defaultWidth) + 5,
        );
      };
      iframe.setAttribute('frameBorder', '0');
      iframe.style.display = 'block';
      badge.appendChild(iframe);
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(badgeMarkup);
      iframe.contentWindow.document.close();
      replaceScriptTags(badge, isCreate);
      // }
    });
    tryClean();
  }

  function replaceScriptTags(node, isCreate) {
    if (shouldReplaceNode(node, isCreate)) {
      node.parentNode.replaceChild(cloneScriptNode(node), node);
      childScripts[node.src] = true;
    } else {
      Array.prototype.slice
        .call(node.childNodes)
        .forEach((child) => replaceScriptTags(child, isCreate));
    }
  }

  function shouldReplaceNode(node, isCreate) {
    return (
      isScriptNode(node) &&
      !childScripts[node.src] &&
      (!isCreate || (isCreate && !node.getAttribute('data-isartdeco')))
    );
  }

  function isScriptNode(node) {
    return node.tagName === 'SCRIPT';
  }

  function cloneScriptNode(node) {
    const script = document.createElement('script');
    Array.prototype.slice
      .call(node.attributes)
      .forEach((attr) => script.setAttribute(attr.name, attr.value));
    return script;
  }

  function tryClean() {
    const done =
      (responsesReceived >= expectedResponses && expectedResponses > 0) ||
      responsesReceived >= badges.length;
    if (done) {
      delete window[CALLBACK_NAME];
      scripts.forEach((script) => document.body.removeChild(script));
    }
  }

  function jsonp(url) {
    const script = document.createElement('script');
    // https://badges.linkedin.com/profile?locale=pt_BR&badgetype=VERTICAL&badgetheme=light&uid=231182&version=v1&maxsize=medium&trk=profile-badge&vanityname=mozgbrasil
    script.src = url;
    script.type = 'text/javascript';
    script.nonce = 'abc123'; // Adicione o nonce aqui
    scripts.push(script);
    document.body.appendChild(script);
  }

  function init() {
    badges = Array.prototype.slice.call(document.querySelectorAll(BADGE_NAMES));
    badges.forEach((badge) => {
      const rendered = badge.getAttribute('data-rendered');
      if (!rendered) {
        expectedResponses++;
        badge.setAttribute('data-rendered', true);
        renderBadge(badge);
      }
    });
    window[CALLBACK_NAME] = responseHandler; // Define o responseHandler como a função de callback

    // Simula o retorno do LinkedIn Badge
    simulateLinkedInResponse();
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init, false);
  }

  // Simula o retorno do LinkedIn Badge
  function simulateLinkedInResponse() {
    const badgeHtml = `
      <link rel="stylesheet" href="https://static.licdn.com/sc/h/2lgytu9f1z9n54epparouqzhy">
      <div class="profile-badge profile-badge--width-250 profile-badge--light" dir="ltr">
        <div class="profile-badge__header profile-badge__header--light">
          <span class="sr-only">LinkedIn</span>
          <icon class="profile-badge__header-logo-icon profile-badge__header-logo-icon--light" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 84 21" preserveAspectRatio="xMinYMin meet" version="1.1" focusable="false">
            <g class="inbug" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M19.479,0 L1.583,0 C0.727,0 0,0.677 0,1.511 L0,19.488 C0,20.323 0.477,21 1.333,21 L19.229,21 C20.086,21 21,20.323 21,19.488 L21,1.511 C21,0.677 20.336,0 19.479,0" class="bug-text-color" transform="translate(63.000000, 0.000000)"></path>
              <path d="M82.479,0 L64.583,0 C63.727,0 63,0.677 63,1.511 L63,19.488 C63,20.323 63.477,21 64.333,21 L82.229,21 C83.086,21 84,20.323 84,19.488 L84,1.511 C84,0.677 83.336,0 82.479,0 Z M71,8 L73.827,8 L73.827,9.441 L73.858,9.441 C74.289,8.664 75.562,7.875 77.136,7.875 C80.157,7.875 81,9.479 81,12.45 L81,18 L78,18 L78,12.997 C78,11.667 77.469,10.5 76.227,10.5 C74.719,10.5 74,11.521 74,13.197 L74,18 L71,18 L71,8 Z M66,18 L69,18 L69,8 L66,8 L66,18 Z M69.375,4.5 C69.375,5.536 68.536,6.375 67.5,6.375 C66.464,6.375 65.625,5.536 65.625,4.5 C65.625,3.464 66.464,2.625 67.5,2.625 C68.536,2.625 69.375,3.464 69.375,4.5 Z" class="background" fill="currentColor"></path>
            </g>
            <g class="linkedin-text">
              <path d="M60,18 L57.2,18 L57.2,16.809 L57.17,16.809 C56.547,17.531 55.465,18.125 53.631,18.125 C51.131,18.125 48.978,16.244 48.978,13.011 C48.978,9.931 51.1,7.875 53.725,7.875 C55.35,7.875 56.359,8.453 56.97,9.191 L57,9.191 L57,3 L60,3 L60,18 Z M54.479,10.125 C52.764,10.125 51.8,11.348 51.8,12.974 C51.8,14.601 52.764,15.875 54.479,15.875 C56.196,15.875 57.2,14.634 57.2,12.974 C57.2,11.268 56.196,10.125 54.479,10.125 L54.479,10.125 Z" fill="currentColor"></path>
              <path d="M47.6611,16.3889 C46.9531,17.3059 45.4951,18.1249 43.1411,18.1249 C40.0001,18.1249 38.0001,16.0459 38.0001,12.7779 C38.0001,9.8749 39.8121,7.8749 43.2291,7.8749 C46.1801,7.8749 48.0001,9.8129 48.0001,13.2219 C48.0001,13.5629 47.9451,13.8999 47.9451,13.8999 L40.8311,13.8999 L40.8481,14.2089 C41.0451,15.0709 41.6961,16.1249 43.1901,16.1249 C44.4941,16.1249 45.3881,15.4239 45.7921,14.8749 L47.6611,16.3889 Z M45.1131,11.9999 C45.1331,10.9449 44.3591,9.8749 43.1391,9.8749 C41.6871,9.8749 40.9121,11.0089 40.8311,11.9999 L45.1131,11.9999 Z" fill="currentColor"></path>
              <polygon fill="currentColor" points="38 8 34.5 8 31 12 31 3 28 3 28 18 31 18 31 13 34.699 18 38.241 18 34 12.533"></polygon>
              <path d="M16,8 L18.827,8 L18.827,9.441 L18.858,9.441 C19.289,8.664 20.562,7.875 22.136,7.875 C25.157,7.875 26,9.792 26,12.45 L26,18 L23,18 L23,12.997 C23,11.525 22.469,10.5 21.227,10.5 C19.719,10.5 19,11.694 19,13.197 L19,18 L16,18 L16,8 Z" fill="currentColor"></path>
              <path d="M11,18 L14,18 L14,8 L11,8 L11,18 Z M12.501,6.3 C13.495,6.3 14.3,5.494 14.3,4.5 C14.3,3.506 13.495,2.7 12.501,2.7 C11.508,2.7 10.7,3.506 10.7,4.5 C10.7,5.494 11.508,6.3 12.501,6.3 Z" fill="currentColor"></path>
              <polygon fill="currentColor" points="3 3 0 3 0 18 9 18 9 15 3 15"></polygon>
            </g>
          </svg>
          </icon>
        </div>
        <div class="profile-badge__content">
          <img class="artdeco-entity-image artdeco-entity-image--circle-4 profile-badge__content-profile-image" alt="Marcio dos Santos Amorim" src="/assets/17202780.jpeg">
          <h3 class="profile-badge__content-profile-name">
            <a class="profile-badge__content-profile-name-link profile-badge__content-profile-name-link--light" href="https://br.linkedin.com/in/mozgbrasil?trk=public-profile-badge-profile-badge-profile-name" data-tracking-control-name="public-profile-badge-profile-badge-profile-name" data-tracking-will-navigate>
              Marcio dos Santos Amorim
            </a>
          </h3>
          <h4 class="profile-badge__content-profile-headline">
            Software Engineer | Full Stack Developer | Dev Backend | Node.js, PHP, Ruby, Python, Perl | Dev Frontend | React, Angular, Vue, Ionic | DevOps
          </h4>
        </div>
        <a class="profile-badge__cta-btn profile-badge__cta-btn--light" href="https://br.linkedin.com/in/mozgbrasil?trk=public-profile-badge-profile-badge-view-profile-cta" target="_blank" data-tracking-control-name="public-profile-badge-profile-badge-view-profile-cta" data-tracking-will-navigate>
          Ver perfil
        </a>
      </div>
    `;
    const badgeUid = 231182;
    responseHandler(badgeHtml, badgeUid); // Chama o responseHandler com o retorno simulado
  }
})(window);
