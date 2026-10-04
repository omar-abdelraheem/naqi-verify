(() => {
  'use strict';

  // نقل مباشر للقيم وأرقام التشغيلات من شهادتي المعمل بتاريخ 19/09/2026.
  const batches = {
    'CIT-0926': {
      type: 'عسل نحل موالح',
      sample: 'Dokki-2026-220290',
      certificate: 'Dokki-486200',
      received: '15/09/2026',
      reported: '19/09/2026',
      report: 'reports/CIT-0926.pdf',
      metrics: { moisture: 18.2, hmf: 19, glucose: 32, fructose: 40.4, sucrose: 0.55, maltose: 2.07 },
      sucroseLimit: 10
    },
    'CLV-0926': {
      type: 'عسل نحل برسيم',
      sample: 'Dokki-2026-220291',
      certificate: 'Dokki-486201',
      received: '15/09/2026',
      reported: '19/09/2026',
      report: 'reports/CLV-0926.pdf',
      metrics: { moisture: 17.6, hmf: 8.4, glucose: 28.5, fructose: 35.1, sucrose: 2.66, maltose: 3.3 },
      sucroseLimit: 5
    }
  };

  const form = document.querySelector('#search-form');
  const input = document.querySelector('#batch-input');
  const suggestionList = document.querySelector('#batch-suggestions');
  const error = document.querySelector('#search-error');
  const lookup = document.querySelector('#lookup');
  const result = document.querySelector('#result');
  const facts = document.querySelector('#facts');
  const metrics = document.querySelector('#metrics');
  const reportLink = document.querySelector('#report-link');
  let suggestionCodes = [];
  let activeSuggestion = -1;

  function closeSuggestions() {
    suggestionList.classList.add('hidden');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeSuggestion = -1;
  }

  function highlightSuggestion(index) {
    activeSuggestion = index;
    const options = suggestionList.querySelectorAll('[role="option"]');
    options.forEach((option, position) => {
      option.setAttribute('aria-selected', String(position === index));
    });
    if (index >= 0) input.setAttribute('aria-activedescendant', options[index].id);
    else input.removeAttribute('aria-activedescendant');
  }

  function renderSuggestions() {
    const query = input.value.trim().toUpperCase();
    suggestionCodes = Object.keys(batches).filter(code =>
      code.includes(query) || batches[code].type.includes(input.value.trim())
    );
    suggestionList.replaceChildren();
    activeSuggestion = -1;
    input.removeAttribute('aria-activedescendant');
    if (!suggestionCodes.length) {
      closeSuggestions();
      return;
    }
    suggestionCodes.forEach(code => {
      const option = document.createElement('button');
      const type = document.createElement('span');
      const number = document.createElement('bdi');
      option.type = 'button';
      option.id = `suggest-${code}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      type.textContent = batches[code].type;
      number.textContent = code;
      option.append(type, number);
      option.addEventListener('click', () => {
        input.value = code;
        showBatch(code);
      });
      suggestionList.append(option);
    });
    suggestionList.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
  }

  function addFact(label, value) {
    const row = document.createElement('div');
    const name = document.createElement('dt');
    const detail = document.createElement('dd');
    name.textContent = label;
    detail.textContent = value;
    row.append(name, detail);
    facts.append(row);
  }

  function addMetric({ label, value, unit, limit, description, comparison, caution }) {
    const card = document.createElement('article');
    card.className = `metric ${limit === undefined ? 'metric-info' : caution ? 'metric-caution' : Number(value) > limit ? 'metric-over' : 'metric-compared'}`;
    const heading = document.createElement('h4');
    heading.textContent = label;
    const reading = document.createElement('div');
    reading.className = 'metric-reading';
    const number = document.createElement('strong');
    number.textContent = value;
    const suffix = document.createElement('span');
    suffix.textContent = unit;
    reading.append(number, suffix);
    card.append(heading, reading);
    if (limit !== undefined) {
      const reference = document.createElement('p');
      reference.className = 'metric-reference';
      reference.textContent = `الحد الأعلى بالمواصفة المصرية: ${limit} ${unit}`;
      const status = document.createElement('span');
      status.className = 'metric-status';
      status.textContent = comparison;
      card.append(reference, status);
    } else {
      const status = document.createElement('span');
      status.className = 'metric-status';
      status.textContent = 'لا توجد مقارنة مباشرة';
      card.append(status);
    }
    const explanation = document.createElement('p');
    explanation.className = 'metric-explanation';
    explanation.textContent = description;
    card.append(explanation);
    metrics.append(card);
  }

  function renderMetrics(batch) {
    const m = batch.metrics;
    metrics.replaceChildren();
    addMetric({ label: 'الرطوبة', value: m.moisture, unit: '%', limit: 20,
      comparison: m.moisture <= 20 ? 'أقل من الحد الأعلى' : 'أعلى من الحد الأعلى'
      });
    addMetric({ label: 'HMF', value: m.hmf, unit: 'مجم/كجم', limit: 80,
      comparison: m.hmf <= 80 ? 'أقل من الحد الأعلى' : 'أعلى من الحد الأعلى'
      });
    addMetric({ label: 'السكروز', value: m.sucrose, unit: '%', limit: batch.sucroseLimit,
      comparison: m.sucrose <= batch.sucroseLimit ? 'أقل من الحد الأعلى' : 'أعلى من الحد الأعلى'
       });
    addMetric({ label: 'الجلوكوز', value: m.glucose, unit: '%'
      });
    addMetric({ label: 'الفركتوز', value: m.fructose, unit: '%'
       });
    addMetric({ label: 'المالتوز', value: m.maltose, unit: '%'
      });
  }

  function showBatch(code, updateUrl = true) {
    const batch = batches[code];
    if (!batch) {
      error.textContent = 'رقم التشغيلة غير موجود. تحقق منه أو اختر الموالح أو البرسيم من القائمة.';
      input.focus();
      return;
    }
    closeSuggestions();
    error.textContent = '';
    document.querySelector('#batch-id').textContent = code;
    facts.replaceChildren();
    addFact('نوع العسل', batch.type);
    addFact('رقم عينة المعمل', batch.sample);
    addFact('رقم الشهادة', batch.certificate);
    addFact('تاريخ استلام العينة', batch.received);
    addFact('تاريخ انتهاء التحليل', batch.reported);
    renderMetrics(batch);
    reportLink.href = batch.report;
    reportLink.setAttribute('aria-label', `عرض شهادة تحليل ${batch.type} الكاملة، ملف PDF`);
    lookup.classList.add('hidden');
    result.classList.remove('hidden');
    document.title = `${batch.type} ${code} | نَقِيّ`;
    if (updateUrl) history.pushState({ code }, '', `?batch=${encodeURIComponent(code)}`);
    window.scrollTo(0, 0);
  }

  function showSearch(updateUrl = true) {
    result.classList.add('hidden');
    lookup.classList.remove('hidden');
    document.title = 'التحقق من تشغيلة العسل | نَقِيّ';
    if (updateUrl) history.pushState({}, '', './');
    window.scrollTo(0, 0);
    input.focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = input.value.trim().toUpperCase().replace(/\s+/g, '');
    if (!code) {
      error.textContent = 'اكتب رقم التشغيلة أولًا.';
      input.focus();
      return;
    }
    showBatch(code);
  });

  input.addEventListener('focus', renderSuggestions);
  input.addEventListener('input', () => {
    error.textContent = '';
    renderSuggestions();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeSuggestions();
      return;
    }
    if (suggestionList.classList.contains('hidden')) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      highlightSuggestion((activeSuggestion + step + suggestionCodes.length) % suggestionCodes.length);
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      const code = suggestionCodes[activeSuggestion];
      input.value = code;
      showBatch(code);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!form.contains(event.target)) closeSuggestions();
  });

  document.querySelectorAll('[data-batch]').forEach(button => {
    button.addEventListener('click', () => showBatch(button.dataset.batch));
  });
  document.querySelector('#back').addEventListener('click', () => showSearch());
  window.addEventListener('popstate', () => {
    const code = new URLSearchParams(location.search).get('batch')?.toUpperCase();
    if (code && batches[code]) showBatch(code, false);
    else showSearch(false);
  });
  document.querySelector('#year').textContent = new Date().getFullYear();
  const initialCode = new URLSearchParams(location.search).get('batch')?.toUpperCase();
  if (initialCode && batches[initialCode]) showBatch(initialCode, false);
})();
