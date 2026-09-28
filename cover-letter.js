// cover-letter.js
// Handles: letter-type-aware guidance, live preview, template switching,
// color/font styling, localStorage save/load, and download (print-to-PDF).
//
// NOTE: Saving currently uses localStorage, matching the rest of
// CVBuilder for now. Swap saveCoverLetter()/loadCoverLetter() for
// a Google Apps Script API call later, same as the CV data.

(function () {
  const STORAGE_KEY = 'cvbuilder_cover_letter';

  // ---------- Letter type configuration ----------
  // Each of the 5 cover letter types gets its own hint text, job-title
  // field label, conditional extra field, and paragraph placeholders.
  const TYPE_CONFIG = {
    application: {
      hint: 'Applying to a specific job posting. Address the exact requirements in the listing.',
      jobTitleLabel: "Job Title You're Applying For",
      jobTitlePlaceholder: 'Frontend Developer',
      conditional: null,
      greeting: 'Dear Hiring Manager,',
      opening: 'I am writing to express my interest in the [Job Title] role at [Company], which I saw posted on [where you found it]. With [X years] of experience in [field], I believe I would be a strong fit for this position.',
      body: 'In my previous role at [Company/Organization], I [specific achievement with a number, e.g. "increased sales by 20%" or "led a team of 5"]. This experience has given me [relevant skill] and [relevant skill], both of which align directly with what you\'re looking for in this role.',
      closing: 'I would welcome the opportunity to discuss how my background fits your needs. Thank you for considering my application, and I look forward to hearing from you.'
    },
    referral: {
      hint: 'Someone inside the company referred you. Lead with that connection early — it builds instant credibility.',
      jobTitleLabel: "Job Title You're Applying For",
      jobTitlePlaceholder: 'Frontend Developer',
      conditional: { label: 'Referred By (Name & Role)', placeholder: 'Jane Smith, Senior Engineer at Acme Corp' },
      greeting: 'Dear Hiring Manager,',
      opening: '[Referrer Name], [their role] at [Company], suggested I reach out about the [Job Title] opening, believing my background in [field] would be a good match for your team.',
      body: 'Having spoken with [Referrer Name] about the role, I understand [Company] is looking for [what they need]. In my current position, I [specific achievement with a number], which I believe speaks directly to that need.',
      closing: "I'd welcome the chance to discuss the role further. Thank you for your time, and please let me know if you need anything else from [Referrer Name] or myself."
    },
    prospecting: {
      hint: 'No open position exists yet — you\'re expressing interest and asking about future openings.',
      jobTitleLabel: 'Desired Role / Area of Interest',
      jobTitlePlaceholder: 'Product Design',
      conditional: { label: 'Department / Area of Interest', placeholder: 'Product Design team' },
      greeting: 'Dear Hiring Manager,',
      opening: "I've long admired [Company]'s work in [industry/area], and I'm writing to introduce myself in case a role opens up on your [Department/Area] team that fits my background in [field].",
      body: "Over the past [X years], I've [key experience/achievement], and I'm especially drawn to how [Company] approaches [something specific about the company]. I'd love to bring that experience to your team when the right opportunity arises.",
      closing: "I understand you may not have an opening right now, but I'd welcome a brief conversation and am happy to share my resume for future consideration."
    },
    networking: {
      hint: "Reaching out for advice, information, or an introduction — not applying to a job directly.",
      jobTitleLabel: 'Role / Field You Want to Learn About',
      jobTitlePlaceholder: 'Data Analytics',
      conditional: { label: 'Contact Person', placeholder: 'Alex Kim' },
      greeting: 'Dear [Contact Person],',
      opening: "I came across your profile through [how you found them] and was impressed by your work in [field]. I'm currently exploring opportunities in [field/role] and would love to learn from your experience.",
      body: "I'm currently [your current situation, e.g. transitioning from X], and I'd value any insight you could share about [specific question — the industry, the company, the role]. Even a brief call or a few email exchanges would mean a lot.",
      closing: 'I know your time is valuable, so I completely understand if this isn\'t possible right now. Either way, thank you for considering it.'
    },
    'career-change': {
      hint: 'Switching industries or roles. Focus on transferable skills rather than direct experience.',
      jobTitleLabel: "Job Title You're Applying For",
      jobTitlePlaceholder: 'Project Manager',
      conditional: { label: 'Transitioning From (Previous Field)', placeholder: 'Retail Management' },
      greeting: 'Dear Hiring Manager,',
      opening: "After [X years] in [previous field], I am excited to bring my experience to the [Job Title] role at [Company]. While my background is in [previous field], the skills I've built there translate directly to this position.",
      body: "In my previous role, I [transferable achievement — e.g. managed a team, solved a complex problem, hit a target]. This built strong [skill] and [skill], both of which are central to succeeding as a [Job Title]. I'm also actively building on this through [course/certification/project, if relevant].",
      closing: "I'm confident that my transferable skills, combined with my enthusiasm for this new direction, would make me a valuable addition to your team. I'd welcome the chance to discuss this further."
    }
  };

  const fields = {
    fullName: document.getElementById('fullName'),
    yourEmail: document.getElementById('yourEmail'),
    yourPhone: document.getElementById('yourPhone'),
    yourAddress: document.getElementById('yourAddress'),
    letterDate: document.getElementById('letterDate'),
    hiringManager: document.getElementById('hiringManager'),
    companyName: document.getElementById('companyName'),
    companyAddress: document.getElementById('companyAddress'),
    jobTitle: document.getElementById('jobTitle'),
    greeting: document.getElementById('greeting'),
    openingParagraph: document.getElementById('openingParagraph'),
    bodyParagraph: document.getElementById('bodyParagraph'),
    closingParagraph: document.getElementById('closingParagraph'),
    signOff: document.getElementById('signOff'),
  };

  const letterTypeSelect = document.getElementById('letterType');
  const typeHint = document.getElementById('typeHint');
  const jobTitleLabel = document.getElementById('jobTitleLabel');
  const conditionalFieldWrap = document.getElementById('conditionalFieldWrap');
  const conditionalFieldLabel = document.getElementById('conditionalFieldLabel');
  const conditionalField = document.getElementById('conditionalField');

  const primaryColorInput = document.getElementById('primaryColor');
  const fontChoiceSelect = document.getElementById('fontChoice');
  const templateButtons = document.querySelectorAll('.cl-template-btn');
  const letterPreview = document.getElementById('letterPreview');
  const saveBtn = document.getElementById('saveBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const saveStatus = document.getElementById('saveStatus');

  const preview = {
    name: document.getElementById('pvName'),
    email: document.getElementById('pvEmail'),
    phone: document.getElementById('pvPhone'),
    address: document.getElementById('pvAddress'),
    date: document.getElementById('pvDate'),
    manager: document.getElementById('pvManager'),
    company: document.getElementById('pvCompany'),
    companyAddress: document.getElementById('pvCompanyAddress'),
    conditional: document.getElementById('pvConditional'),
    greeting: document.getElementById('pvGreeting'),
    opening: document.getElementById('pvOpening'),
    body: document.getElementById('pvBody'),
    closing: document.getElementById('pvClosing'),
    signOff: document.getElementById('pvSignOff'),
    signName: document.getElementById('pvSignName'),
  };

  let activeTemplate = 'modern';
  let activeType = 'application';

  function formatDate(value) {
    if (!value) return new Date().toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const CONDITIONAL_TAG_PREFIX = {
    referral: 'Referred by: ',
    prospecting: 'Regarding: ',
    networking: 'Re: ',
    'career-change': 'Transitioning from: '
  };

  function applyTypeConfig(type, opts) {
    const options = opts || {};
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.application;
    activeType = type;

    typeHint.textContent = config.hint;
    jobTitleLabel.textContent = config.jobTitleLabel;
    fields.jobTitle.placeholder = config.jobTitlePlaceholder;

    if (config.conditional) {
      conditionalFieldWrap.classList.remove('cl-hidden');
      conditionalFieldLabel.textContent = config.conditional.label;
      conditionalField.placeholder = config.conditional.placeholder;
    } else {
      conditionalFieldWrap.classList.add('cl-hidden');
      if (!options.preserveConditionalValue) conditionalField.value = '';
    }

    // Only overwrite placeholders (not user-typed content) so switching
    // type never erases what someone has already written.
    fields.greeting.placeholder = config.greeting;
    fields.openingParagraph.placeholder = config.opening;
    fields.bodyParagraph.placeholder = config.body;
    fields.closingParagraph.placeholder = config.closing;
  }

  function updatePreview() {
    preview.name.textContent = fields.fullName.value || 'Your Name';
    preview.email.textContent = fields.yourEmail.value || 'your@email.com';
    preview.phone.textContent = fields.yourPhone.value || '';
    preview.address.textContent = fields.yourAddress.value || '';

    preview.date.textContent = formatDate(fields.letterDate.value);

    preview.manager.textContent = fields.hiringManager.value || 'Hiring Manager';
    preview.company.textContent = fields.companyName.value || 'Company Name';
    preview.companyAddress.textContent = fields.companyAddress.value || '';

    const tagPrefix = CONDITIONAL_TAG_PREFIX[activeType];
    preview.conditional.textContent = (tagPrefix && conditionalField.value)
      ? tagPrefix + conditionalField.value
      : '';

    preview.greeting.textContent = fields.greeting.value || TYPE_CONFIG[activeType].greeting;

    preview.opening.textContent = fields.openingParagraph.value ||
      'Your opening paragraph will appear here as you type it on the left.';
    preview.body.textContent = fields.bodyParagraph.value ||
      'Your body paragraph will appear here.';
    preview.closing.textContent = fields.closingParagraph.value ||
      'Your closing paragraph will appear here.';

    preview.signOff.textContent = fields.signOff.value || 'Sincerely,';
    preview.signName.textContent = fields.fullName.value || 'Your Name';
  }

  function applyStyle() {
    const color = primaryColorInput.value;
    const font = fontChoiceSelect.value;
    document.documentElement.style.setProperty('--cl-primary', color);
    document.documentElement.style.setProperty('--cl-font', font);
  }

  function setTemplate(name) {
    activeTemplate = name;
    letterPreview.classList.remove('cl-template-modern', 'cl-template-banner', 'cl-template-bold');
    letterPreview.classList.add('cl-template-' + name);
    templateButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.template === name);
    });
  }

  function collectData() {
    const data = {
      template: activeTemplate,
      letterType: activeType,
      conditionalField: conditionalField.value,
      primaryColor: primaryColorInput.value,
      font: fontChoiceSelect.value
    };
    Object.keys(fields).forEach((key) => { data[key] = fields[key].value; });
    return data;
  }

  function saveCoverLetter() {
    const data = collectData();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      saveStatus.textContent = 'Saved ✓';
      setTimeout(() => { saveStatus.textContent = ''; }, 2000);
    } catch (err) {
      saveStatus.textContent = 'Could not save (storage unavailable).';
    }
  }

  function loadCoverLetter() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return;
    }
    if (!raw) return;

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      return;
    }

    Object.keys(fields).forEach((key) => {
      if (data[key] !== undefined) fields[key].value = data[key];
    });
    if (data.primaryColor) primaryColorInput.value = data.primaryColor;
    if (data.font) fontChoiceSelect.value = data.font;
    if (data.template) setTemplate(data.template);
    if (data.letterType) {
      letterTypeSelect.value = data.letterType;
      applyTypeConfig(data.letterType, { preserveConditionalValue: true });
    }
    if (data.conditionalField) conditionalField.value = data.conditionalField;

    applyStyle();
    updatePreview();
  }

  function attachListeners() {
    Object.values(fields).forEach((el) => {
      el.addEventListener('input', updatePreview);
    });
    conditionalField.addEventListener('input', updatePreview);
    letterTypeSelect.addEventListener('change', () => {
      applyTypeConfig(letterTypeSelect.value);
      updatePreview();
    });

    primaryColorInput.addEventListener('input', applyStyle);
    fontChoiceSelect.addEventListener('change', applyStyle);

    templateButtons.forEach((btn) => {
      btn.addEventListener('click', () => setTemplate(btn.dataset.template));
    });

    saveBtn.addEventListener('click', saveCoverLetter);
    downloadBtn.addEventListener('click', () => window.print());
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTypeConfig(letterTypeSelect.value);
    attachListeners();
    applyStyle();
    updatePreview();
    loadCoverLetter();
  });
})();