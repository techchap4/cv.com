/* =========================================================
   CVBuilder editor.js
   COMPLETE CORRECTED VERSION

   Features:
   - Personal information
   - Summary / objective
   - Work experience
   - Education
   - Skills
   - Achievements & awards
   - Volunteer work / attachments / internships
   - Memberships & professional bodies
   - Courses / training / certificates
   - Projects
   - Publications
   - Languages
   - Hobbies & interests
   - Referees
   - LocalStorage persistence
   - Undo / redo
   - Live A4 preview
   - UNLIMITED A4 PAGES
   - Automatic page numbering
   - Print / Save as PDF
   - Month and year date selection
========================================================= */

(() => {
  'use strict';

  /* =========================================================
     BASIC HELPERS
  ========================================================= */

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Shared template registry (cv-templates.js). Falls back safely if it is missing. */
  const CVT = window.CVTemplates || {
    normalize: v => v || 'modern',
    name: v => v || 'Modern'
  };

  const PREFIX = 'cvbuilder_';
  const CURRENT = 'current_cv';

  const order = [
    'personal',
    'summary',
    'experience',
    'education',
    'skills',
    'achievements',
    'volunteer',
    'memberships',
    'certifications',
    'projects',
    'publications',
    'languages',
    'interests',
    'referees'
  ];

  let saveTimer = null;
  let zoom = 1;
  let history = [];
  let historyIndex = -1;

  const esc = v =>
    String(v ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[c])
    );

  const text = id =>
    ($(id)?.value || '').trim();

  const uid = p =>
    `${p}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  const nl = v =>
    esc(v).replace(/\r?\n/g, '<br>');

  /* =========================================================
     LOCAL STORAGE
  ========================================================= */

  function meta() {
    try {
      return JSON.parse(
        localStorage.getItem(CURRENT) || 'null'
      ) || {};
    } catch (e) {
      return {};
    }
  }

  /* =========================================================
     DEFAULT DATA
  ========================================================= */

  function defaults() {

    const m = meta();

    return {
      cv_id:
        m.cv_id ||
        uid('cv'),

      cv_title:
        m.cv_title ||
        'My Professional CV',

      template: CVT.normalize(m.template),

      primary_color:
        m.primary_color ||
        '#15803d',

      font:
        m.font ||
        'Inter',

      photo: '',

      personal: {
        fullName: '',
        professionalTitle: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        linkedin: '',
        otherLink: ''
      },

      summary: '',

      interests: '',

      refereesOnRequest: false,

      experience: [],

      education: [],

      skills: [],

      achievements: [],

      volunteer: [],

      memberships: [],

      certifications: [],

      projects: [],

      publications: [],

      languages: [],

      referees: []
    };
  }

  /* =========================================================
     MERGE SAVED DATA WITH DEFAULT DATA
  ========================================================= */

  function merge(a, b) {

    if (
      !b ||
      typeof b !== 'object'
    ) {
      return a;
    }

    Object.keys(b).forEach(k => {

      if (
        b[k] &&
        typeof b[k] === 'object' &&
        !Array.isArray(b[k]) &&
        a[k] &&
        typeof a[k] === 'object' &&
        !Array.isArray(a[k])
      ) {

        a[k] = merge(
          a[k],
          b[k]
        );

      } else {

        a[k] = b[k];

      }

    });

    return a;
  }

  let data = defaults();

  const cvId = data.cv_id;

  /* =========================================================
     A4 PREVIEW STYLES

     These styles restore the A4 pages even if editor.css
     does not contain the required page styles.
  ========================================================= */

  function injectCVStyles() {

    if ($('#cvRuntimeStyles')) {
      return;
    }

    const style =
      document.createElement('style');

    style.id =
      'cvRuntimeStyles';

    style.textContent = `

      /* -----------------------------------------
         PREVIEW SCROLL AREA
      ----------------------------------------- */

      .preview-scroll {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 18px 24px 40px;
        box-sizing: border-box;
      }

      /* -----------------------------------------
         A4 PAGE CONTAINER
      ----------------------------------------- */

      .cv-pages {

        width: 210mm;

        min-width: 210mm;

        display: flex;

        flex-direction: column;

        align-items: center;

        gap: 18px;

        padding: 0 0 30px;

        box-sizing: border-box;

        transform-origin: top center;

      }

      /* -----------------------------------------
         INDIVIDUAL A4 PAGE
      ----------------------------------------- */

      .cv-page {

        width: 210mm;

        min-width: 210mm;

        height: 297mm;

        min-height: 297mm;

        box-sizing: border-box;

        background: #ffffff;

        color: #222222;

        font-family:
          var(--font,
          Inter,
          Arial,
          sans-serif);

        padding:
          15mm
          16mm
          15mm;

        position: relative;

        overflow: hidden;

        flex: 0 0 auto;

        box-shadow:
          0 8px 28px
          rgba(0, 0, 0, .14);

      }

      /* -----------------------------------------
         CONTENT AREA OF EACH A4 PAGE
      ----------------------------------------- */

      .cv-page-content {

        width: 100%;

        height: 266mm;

        overflow: hidden;

        box-sizing: border-box;

      }

      /* -----------------------------------------
         CV HEADER
      ----------------------------------------- */

      .cv-page-header {

        position: relative;

        padding-bottom: 7mm;

        margin-bottom: 5mm;

        border-bottom:
          2px solid
          var(--cv-primary, #15803d);

      }

      .cv-photo {

        width: 30mm;

        height: 30mm;

        object-fit: cover;

        border-radius: 50%;

        float: right;

        margin-left: 8mm;

        border:
          2px solid
          var(--cv-primary, #15803d);

      }

      .cv-name {

        margin:
          0 0 2mm;

        color:
          var(--cv-primary, #15803d);

        font-size:
          25px;

        line-height:
          1.15;

        font-weight:
          800;

      }

      .cv-title {

        font-size:
          14px;

        font-weight:
          600;

        margin-bottom:
          3mm;

      }

      .cv-contact {

        display:
          flex;

        flex-wrap:
          wrap;

        gap:
          2mm 5mm;

        font-size:
          9.5px;

        line-height:
          1.4;

        color:
          #555555;

      }

      /* -----------------------------------------
         SECTIONS
      ----------------------------------------- */

      .cv-section {

        margin:
          0 0 5mm;

        break-inside:
          avoid;

      }

      .cv-section h3 {

        margin:
          0 0 2.5mm;

        padding-bottom:
          1.5mm;

        border-bottom:
          1px solid #dddddd;

        color:
          var(--cv-primary, #15803d);

        font-size:
          11px;

        letter-spacing:
          .08em;

        text-transform:
          uppercase;

      }

      /* -----------------------------------------
         TEXT
      ----------------------------------------- */

      .cv-summary,
      .cv-entry-description,
      .cv-inline-list,
      .cv-referee {

        font-size:
          9.8px;

        line-height:
          1.48;

      }

      /* -----------------------------------------
         ENTRIES
      ----------------------------------------- */

      .cv-entry {

        margin:
          0 0 4mm;

        break-inside:
          avoid;

      }

      .cv-entry:last-child {

        margin-bottom:
          0;

      }

      .cv-entry-head {

        display:
          flex;

        justify-content:
          space-between;

        gap:
          8mm;

        align-items:
          baseline;

      }

      .cv-entry-title {

        font-size:
          10.8px;

        font-weight:
          800;

      }

      .cv-entry-meta {

        font-size:
          8.8px;

        color:
          #666666;

        white-space:
          nowrap;

        text-align:
          right;

      }

      .cv-entry-org {

        color:
          var(--cv-primary, #15803d);

        font-weight:
          700;

        font-size:
          9.8px;

        margin-top:
          .8mm;

      }

      .cv-entry-location {

        color:
          #666666;

        font-size:
          8.8px;

        margin-top:
          .5mm;

      }

      .cv-entry-description {

        margin-top:
          1.5mm;

      }

      .cv-link {

        color:
          var(--cv-primary, #15803d);

        word-break:
          break-all;

      }

      /* -----------------------------------------
         SKILLS
      ----------------------------------------- */

      .cv-skills {

        display:
          flex;

        flex-wrap:
          wrap;

        gap:
          2mm;

      }

      .cv-skill {

        border:
          1px solid #d7eadf;

        background:
          #eef8f2;

        color:
          var(--cv-primary, #15803d);

        border-radius:
          20px;

        padding:
          1.5mm 3mm;

        font-size:
          9px;

        font-weight:
          700;

      }

      /* -----------------------------------------
         LANGUAGES
      ----------------------------------------- */

      .cv-languages {

        display:
          grid;

        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );

        gap:
          3mm 8mm;

      }

      .cv-language {

        display:
          flex;

        justify-content:
          space-between;

        gap:
          4mm;

        font-size:
          9.5px;

        border-bottom:
          1px dotted #dddddd;

        padding-bottom:
          1.5mm;

      }

      .cv-language span {

        color:
          #666666;

      }

      /* -----------------------------------------
         REFEREES
      ----------------------------------------- */

      .cv-referees {

        display:
          grid;

        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );

        gap:
          5mm;

      }

      .cv-referee {

        padding:
          3mm;

        border:
          1px solid #dddddd;

        border-radius:
          2mm;

      }

      /* -----------------------------------------
         DATE DROPDOWN
      ----------------------------------------- */

      .date-month-year {

        width:
          100%;

        min-height:
          42px;

        padding:
          9px 12px;

        border:
          1px solid #cdcbc0;

        border-radius:
          6px;

        background:
          #ffffff;

        color:
          #171b19;

        font:
          inherit;

      }

      .date-month-year:focus {

        outline:
          none;

        border-color:
          var(--cv-primary, #15803d);

        box-shadow:
          0 0 0 3px
          rgba(
            21,
            128,
            61,
            .12
          );

      }

      /* -----------------------------------------
         PAGE FOOTER
      ----------------------------------------- */

      .cv-page-footer {

        position:
          absolute;

        left:
          16mm;

        right:
          16mm;

        bottom:
          7mm;

        text-align:
          center;

        font-size:
          8px;

        color:
          #777777;

        border-top:
          1px solid #eeeeee;

        padding-top:
          2mm;

      }

      /* -----------------------------------------
         PRINT / PDF
      ----------------------------------------- */

      @page {

        size:
          A4 portrait;

        margin:
          0;

      }

      @media print {

        html,
        body {

          margin:
            0 !important;

          padding:
            0 !important;

          background:
            #ffffff !important;

        }

        body * {

          visibility:
            hidden !important;

        }

        #cvPages,
        #cvPages * {

          visibility:
            visible !important;

        }

        #cvPages {

          position:
            static !important;

          width:
            210mm !important;

          transform:
            none !important;

          padding:
            0 !important;

          margin:
            0 !important;

          display:
            block !important;

        }

        .preview-scroll {

          overflow:
            visible !important;

          padding:
            0 !important;

        }

        .cv-page {

          width:
            210mm !important;

          min-width:
            210mm !important;

          height:
            297mm !important;

          min-height:
            297mm !important;

          margin:
            0 !important;

          box-shadow:
            none !important;

          page-break-after:
            always !important;

          break-after:
            page !important;

        }

        .cv-page:last-child {

          page-break-after:
            auto !important;

          break-after:
            auto !important;

        }

      }

    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     LOAD SAVED DATA
  ========================================================= */

  function load() {

    try {

      const saved =
        JSON.parse(
          localStorage.getItem(
            PREFIX + cvId
          ) || 'null'
        );

      if (saved) {

        data =
          merge(
            defaults(),
            saved
          );

      }

    } catch (e) {

      console.error(
        'Could not load CV data:',
        e
      );

    }

    data.template = CVT.normalize(data.template);

    const title =
      $('#cvTitle');

    if (title) {

      title.value =
        data.cv_title ||
        'My Professional CV';

    }

    setAppearance();

    populate();

    render();

    pushHistory(false);

    loadAccount();

  }

  /* =========================================================
     COLLECT REPEATABLE DATA
  ========================================================= */

  function collectRepeat(
    container,
    selectors
  ) {

    return $$(

      container +
      ' .repeatable-card'

    )

      .map(card => {

        const o = {
          id:
            card.dataset.id ||
            uid('item')
        };

        Object.entries(
          selectors
        ).forEach(
          ([key, selector]) => {

            const el =
              $(selector, card);

            if (el) {

              o[key] =
                el.type === 'checkbox'
                  ? el.checked
                  : (
                      el.value ||
                      ''
                    ).trim();

            }

          }
        );

        return o;

      })

      .filter(o =>
        Object.entries(o)
          .some(
            ([key, value]) =>
              key !== 'id' &&
              value
          )
      );

  }

  /* =========================================================
     COLLECT ALL FORM DATA
  ========================================================= */

  function collect() {

    data.cv_title =
      text('#cvTitle') ||
      'My Professional CV';

    data.personal = {

      fullName:
        text('#fullName'),

      professionalTitle:
        text('#professionalTitle'),

      email:
        text('#email'),

      phone:
        text('#phone'),

      location:
        text('#location'),

      website:
        text('#website'),

      linkedin:
        text('#linkedin'),

      otherLink:
        text('#otherLink')

    };

    data.summary =
      text('#summary');

    data.interests =
      text('#interests');

    data.refereesOnRequest =
      !!$('#refereesOnRequest')?.checked;

    data.experience =
      collectRepeat(
        '#experienceList',
        {
          position:
            '.experience-position',

          company:
            '.experience-company',

          location:
            '.experience-location',

          start:
            '.experience-start',

          end:
            '.experience-end',

          current:
            '.experience-current',

          description:
            '.experience-description'
        }
      );

    data.education =
      collectRepeat(
        '#educationList',
        {
          qualification:
            '.education-qualification',

          institution:
            '.education-institution',

          field:
            '.education-field',

          start:
            '.education-start',

          end:
            '.education-end',

          description:
            '.education-description'
        }
      );

    data.achievements =
      collectRepeat(
        '#achievementList',
        {
          title:
            '.achievement-title',

          organization:
            '.achievement-organization',

          date:
            '.achievement-date',

          description:
            '.achievement-description'
        }
      );

    data.volunteer =
      collectRepeat(
        '#volunteerList',
        {
          role:
            '.volunteer-role',

          organization:
            '.volunteer-organization',

          type:
            '.volunteer-type',

          location:
            '.volunteer-location',

          start:
            '.volunteer-start',

          end:
            '.volunteer-end',

          description:
            '.volunteer-description'
        }
      );

    data.memberships =
      collectRepeat(
        '#membershipList',
        {
          body:
            '.membership-body',

          role:
            '.membership-role',

          date:
            '.membership-date',

          description:
            '.membership-description'
        }
      );

    data.certifications =
      collectRepeat(
        '#certificationList',
        {
          name:
            '.certification-name',

          issuer:
            '.certification-issuer',

          date:
            '.certification-date',

          credential:
            '.certification-credential',

          description:
            '.certification-description'
        }
      );

    data.projects =
      collectRepeat(
        '#projectList',
        {
          name:
            '.project-name',

          role:
            '.project-role',

          date:
            '.project-date',

          link:
            '.project-link',

          description:
            '.project-description'
        }
      );

    data.publications =
      collectRepeat(
        '#publicationList',
        {
          title:
            '.publication-title',

          publisher:
            '.publication-publisher',

          date:
            '.publication-date',

          link:
            '.publication-link',

          description:
            '.publication-description'
        }
      );

    data.languages =
      collectRepeat(
        '#languageList',
        {
          name:
            '.language-name',

          level:
            '.language-level'
        }
      );

    data.referees =
      collectRepeat(
        '#refereeList',
        {
          name:
            '.referee-name',

          title:
            '.referee-title',

          institution:
            '.referee-institution',

          phone:
            '.referee-phone',

          email:
            '.referee-email'
        }
      );

    return data;

  }

  /* =========================================================
     MONTH + YEAR OPTIONS

     This replaces input type="month".

     Available years:
     1950 -> current year + 10

     Example:
     January 2024
     February 2024
     March 2024
     ...
  ========================================================= */

  function monthYearOptions(
    selected = ''
  ) {

    const months = [

      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'

    ];

    const currentYear =
      new Date().getFullYear();

    const firstYear =
      1950;

    const lastYear =
      currentYear + 10;

    let html =
      '<option value="">Select month and year</option>';

    for (
      let year = lastYear;
      year >= firstYear;
      year--
    ) {

      html +=
        `<optgroup label="${year}">`;

      for (
        let month = 12;
        month >= 1;
        month--
      ) {

        const value =
          `${year}-${String(month).padStart(2, '0')}`;

        html +=
          `<option value="${value}" ${
            value === selected
              ? 'selected'
              : ''
          }>${months[month - 1]} ${year}</option>`;

      }

      html +=
        '</optgroup>';

    }

    return html;

  }

  /* =========================================================
     INPUT GENERATOR

     IMPORTANT:
     When type = "month", a dropdown is created instead of
     native input type="month".
  ========================================================= */

  function inp(
    cls,
    label,
    v,
    ph = '',
    type = 'text'
  ) {

    if (type === 'month') {

      return `

        <div class="form-group">

          <label>
            ${label}
          </label>

          <select
            class="${cls} date-month-year"
          >

            ${monthYearOptions(
              v || ''
            )}

          </select>

        </div>

      `;

    }

    return `

      <div class="form-group">

        <label>
          ${label}
        </label>

        <input
          class="${cls}"
          type="${type}"
          value="${esc(v)}"
          placeholder="${esc(ph)}"
        >

      </div>

    `;

  }

  /* =========================================================
     TEXTAREA GENERATOR
  ========================================================= */

  function ta(
    cls,
    label,
    v,
    ph = ''
  ) {

    return `

      <div class="form-group full">

        <label>
          ${label}
        </label>

        <textarea
          class="${cls}"
          rows="5"
          placeholder="${esc(ph)}"
        >${esc(v)}</textarea>

      </div>

    `;

  }

  /* =========================================================
     REPEATABLE CARD
  ========================================================= */

  function card(
    type,
    title,
    x,
    i,
    body
  ) {

    const el =
      document.createElement('div');

    el.className =
      `form-card repeatable-card ${type}-item`;

    el.dataset.id =
      x.id ||
      uid(type);

    el.innerHTML = `

      <div class="repeatable-header">

        <div>

          <span class="item-number">

            ${String(i + 1).padStart(2, '0')}

          </span>

          <span class="item-title">

            ${title}

          </span>

        </div>

        <button
          type="button"
          class="delete-item-btn"
        >

          <span class="material-icons">
            delete_outline
          </span>

        </button>

      </div>

      ${body}

    `;

    return el;

  }

  /* =========================================================
     FORM BUILDERS
  ========================================================= */

  const builders = {

    experience: (
      x,
      i
    ) => card(
      'experience',
      'Work Experience',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'experience-position',
          'Job Title',
          x.position,
          'e.g. Graphic Designer'
        )}

        ${inp(
          'experience-company',
          'Company / Organization',
          x.company,
          'e.g. ABC Company'
        )}

        ${inp(
          'experience-location',
          'Location',
          x.location,
          'Nairobi, Kenya'
        )}

        ${inp(
          'experience-start',
          'Start Date',
          x.start,
          '',
          'month'
        )}

        ${inp(
          'experience-end',
          'End Date',
          x.end,
          '',
          'month'
        )}

      </div>

      <label class="checkbox-row">

        <input
          class="experience-current"
          type="checkbox"
          ${x.current ? 'checked' : ''}
        >

        I currently work here

      </label>

      ${ta(
        'experience-description',
        'Description',
        x.description,
        'Responsibilities, achievements and contributions...'
      )}

      `
    ),

    education: (
      x,
      i
    ) => card(
      'education',
      'Education',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'education-qualification',
          'Qualification',
          x.qualification,
          'e.g. Bachelor of Education'
        )}

        ${inp(
          'education-institution',
          'Institution',
          x.institution,
          'e.g. University'
        )}

        ${inp(
          'education-field',
          'Field of Study',
          x.field,
          'e.g. Education Arts'
        )}

        ${inp(
          'education-start',
          'Start Date',
          x.start,
          '',
          'month'
        )}

        ${inp(
          'education-end',
          'End Date',
          x.end,
          '',
          'month'
        )}

      </div>

      ${ta(
        'education-description',
        'Description',
        x.description,
        'Achievements, coursework, grades or activities...'
      )}

      `
    ),

    achievement: (
      x,
      i
    ) => card(
      'achievement',
      'Achievement / Award',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'achievement-title',
          'Award / Achievement',
          x.title,
          'e.g. Best Employee Award'
        )}

        ${inp(
          'achievement-organization',
          'Organization',
          x.organization,
          'Awarding organization'
        )}

        ${inp(
          'achievement-date',
          'Date',
          x.date,
          'e.g. 2026'
        )}

      </div>

      ${ta(
        'achievement-description',
        'Details',
        x.description,
        'Briefly explain the achievement...'
      )}

      `
    ),

    volunteer: (
      x,
      i
    ) => card(
      'volunteer',
      'Volunteer / Attachment / Internship',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'volunteer-role',
          'Role / Position',
          x.role,
          'e.g. ICT Intern'
        )}

        ${inp(
          'volunteer-organization',
          'Organization',
          x.organization,
          'Institution / Company'
        )}

        ${inp(
          'volunteer-type',
          'Type',
          x.type,
          'Internship / Attachment / Volunteer'
        )}

        ${inp(
          'volunteer-location',
          'Location',
          x.location,
          'Nairobi, Kenya'
        )}

        ${inp(
          'volunteer-start',
          'Start Date',
          x.start,
          '',
          'month'
        )}

        ${inp(
          'volunteer-end',
          'End Date',
          x.end,
          '',
          'month'
        )}

      </div>

      ${ta(
        'volunteer-description',
        'Description',
        x.description,
        'Responsibilities, skills gained and contributions...'
      )}

      `
    ),

    membership: (
      x,
      i
    ) => card(
      'membership',
      'Professional Membership',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'membership-body',
          'Professional Body / Association',
          x.body,
          'e.g. KISM'
        )}

        ${inp(
          'membership-role',
          'Membership / Role',
          x.role,
          'e.g. Member'
        )}

        ${inp(
          'membership-date',
          'Period / Year',
          x.date,
          'e.g. 2024 – Present'
        )}

      </div>

      ${ta(
        'membership-description',
        'Details',
        x.description,
        'Membership number or relevant information...'
      )}

      `
    ),

    certification: (
      x,
      i
    ) => card(
      'certification',
      'Course / Certificate',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'certification-name',
          'Course / Certificate',
          x.name,
          'e.g. Mental Health Awareness'
        )}

        ${inp(
          'certification-issuer',
          'Institution / Issuer',
          x.issuer,
          'Institution'
        )}

        ${inp(
          'certification-date',
          'Date / Year',
          x.date,
          'e.g. 2026'
        )}

        ${inp(
          'certification-credential',
          'Credential / Status',
          x.credential,
          'Certificate awarded / Training completed'
        )}

      </div>

      ${ta(
        'certification-description',
        'Details',
        x.description,
        'Optional description...'
      )}

      `
    ),

    project: (
      x,
      i
    ) => card(
      'project',
      'Project',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'project-name',
          'Project Name',
          x.name,
          'e.g. CV Website Builder'
        )}

        ${inp(
          'project-role',
          'Role',
          x.role,
          'Your role'
        )}

        ${inp(
          'project-date',
          'Date / Period',
          x.date,
          '2026'
        )}

        ${inp(
          'project-link',
          'Project Link',
          x.link,
          'https://...',
          'url'
        )}

      </div>

      ${ta(
        'project-description',
        'Description',
        x.description,
        'What you built, your role and result...'
      )}

      `
    ),

    publication: (
      x,
      i
    ) => card(
      'publication',
      'Publication',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'publication-title',
          'Title',
          x.title,
          'Article / paper title'
        )}

        ${inp(
          'publication-publisher',
          'Publisher / Journal',
          x.publisher,
          'Publisher'
        )}

        ${inp(
          'publication-date',
          'Date',
          x.date,
          '2026'
        )}

        ${inp(
          'publication-link',
          'Link',
          x.link,
          'https://...',
          'url'
        )}

      </div>

      ${ta(
        'publication-description',
        'Description',
        x.description,
        'Short description...'
      )}

      `
    ),

    language: (
      x,
      i
    ) => card(
      'language',
      'Language',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'language-name',
          'Language',
          x.name,
          'e.g. English'
        )}

        <div class="form-group">

          <label>
            Proficiency
          </label>

          <select
            class="language-level"
          >

            ${
              [
                'Native',
                'Fluent',
                'Advanced',
                'Intermediate',
                'Basic'
              ]

                .map(
                  v =>
                    `<option ${
                      x.level === v
                        ? 'selected'
                        : ''
                    }>${v}</option>`
                )

                .join('')
            }

          </select>

        </div>

      </div>

      `
    ),

    referee: (
      x,
      i
    ) => card(
      'referee',
      'Referee',
      x,
      i,

      `

      <div class="form-grid">

        ${inp(
          'referee-name',
          'Full Name',
          x.name,
          'Referee name'
        )}

        ${inp(
          'referee-title',
          'Title / Position',
          x.title,
          'e.g. Lecturer / Manager'
        )}

        ${inp(
          'referee-institution',
          'Institution / Company',
          x.institution,
          'Institution'
        )}

        ${inp(
          'referee-phone',
          'Phone',
          x.phone,
          '+254...'
        )}

        ${inp(
          'referee-email',
          'Email',
          x.email,
          'email@example.com',
          'email'
        )}

      </div>

      `
    )

  };

  /* =========================================================
     CONTAINERS
  ========================================================= */

  const containers = {

    experience:
      'experienceList',

    education:
      'educationList',

    achievement:
      'achievementList',

    volunteer:
      'volunteerList',

    membership:
      'membershipList',

    certification:
      'certificationList',

    project:
      'projectList',

    publication:
      'publicationList',

    language:
      'languageList',

    referee:
      'refereeList'

  };

  const arrays = {

    experience:
      'experience',

    education:
      'education',

    achievement:
      'achievements',

    volunteer:
      'volunteer',

    membership:
      'memberships',

    certification:
      'certifications',

    project:
      'projects',

    publication:
      'publications',

    language:
      'languages',

    referee:
      'referees'

  };

  /* =========================================================
     POPULATE FORM
  ========================================================= */

  function populate() {

    const p =
      data.personal || {};

    [
      'fullName',
      'professionalTitle',
      'email',
      'phone',
      'location',
      'website',
      'linkedin',
      'otherLink'
    ].forEach(
      id => {

        if ($('#' + id)) {

          $('#' + id).value =
            p[id] || '';

        }

      }
    );

    if ($('#summary')) {

      $('#summary').value =
        data.summary || '';

    }

    if ($('#interests')) {

      $('#interests').value =
        data.interests || '';

    }

    if ($('#refereesOnRequest')) {

      $('#refereesOnRequest').checked =
        !!data.refereesOnRequest;

    }

    Object.keys(
      containers
    ).forEach(
      type => {

        const box =
          $('#' + containers[type]);

        if (!box) {
          return;
        }

        box.innerHTML =
          '';

        (
          data[
            arrays[type]
          ] || []
        ).forEach(
          (x, i) => {

            box.appendChild(
              builders[type](x, i)
            );

          }
        );

      }
    );

    if (
      !data.experience.length
    ) {

      add('experience');

    }

    if (
      !data.education.length
    ) {

      add('education');

    }

    renderSkills();

    renderPhoto();

    renumber();

    counter();

  }

  /* =========================================================
     ADD ITEM
  ========================================================= */

  function add(type) {

    const box =
      $('#' + containers[type]);

    if (!box) {
      return;
    }

    const x = {
      id:
        uid(type)
    };

    box.appendChild(
      builders[type](
        x,
        box.children.length
      )
    );

    bindDeletes();

    renumber();

    schedule();

  }

  /* =========================================================
     DELETE BUTTONS
  ========================================================= */

  function bindDeletes() {

    $$('.delete-item-btn')
      .forEach(
        button => {

          if (
            button.dataset.bound
          ) {

            return;

          }

          button.dataset.bound =
            '1';

          button.onclick =
            () => {

              button
                .closest(
                  '.repeatable-card'
                )
                ?.remove();

              renumber();

              render();

              schedule();

            };

        }
      );

  }

  /* =========================================================
     NUMBER REPEATABLE CARDS
  ========================================================= */

  function renumber() {

    Object.values(
      containers
    ).forEach(
      id => {

        $$(
          '#' +
          id +
          ' .repeatable-card'
        ).forEach(
          (card, i) => {

            const number =
              $('.item-number', card);

            if (number) {

              number.textContent =
                String(i + 1)
                  .padStart(2, '0');

            }

          }
        );

      }
    );

  }

  /* =========================================================
     SKILLS
  ========================================================= */

  function renderSkills() {

    const box =
      $('#skillTags');

    if (!box) {
      return;
    }

    box.innerHTML =
      '';

    (
      data.skills || []
    ).forEach(
      (skill, i) => {

        const el =
          document.createElement('div');

        el.className =
          'skill-tag';

        el.innerHTML = `

          <span>
            ${esc(skill.name)}
          </span>

          <small>
            ${esc(skill.level)}
          </small>

          <button
            type="button"
          >
            ×
          </button>

        `;

        const button =
          $('button', el);

        button.onclick =
          () => {

            data.skills.splice(
              i,
              1
            );

            render();

            schedule();

          };

        box.appendChild(el);

      }
    );

  }

  function addSkill() {

    const n =
      text('#skillInput');

    if (!n) {
      return;
    }

    data.skills.push({

      id:
        uid('skill'),

      name:
        n,

      level:
        $('#skillLevel')?.value || ''

    });

    if ($('#skillInput')) {

      $('#skillInput').value =
        '';

    }

    render();

    schedule();

  }

  /* =========================================================
     PHOTO
  ========================================================= */

  function renderPhoto() {

    const box =
      $('#editorPhoto');

    if (!box) {
      return;
    }

    box.innerHTML =
      data.photo

        ? `<img
             src="${data.photo}"
             alt="Profile photo"
           >`

        : `<span class="material-icons">
             person
           </span>`;

  }

  /* =========================================================
     APPEARANCE
  ========================================================= */

  function setAppearance() {

    document.documentElement
      .style
      .setProperty(
        '--cv-primary',
        data.primary_color ||
        '#15803d'
      );

    document.documentElement
      .style
      .setProperty(
        '--font',
        `"${data.font || 'Inter'}",Arial,sans-serif`
      );

    /* selected template */
    data.template = CVT.normalize(data.template);
    $('#cvPages')?.setAttribute('data-template', data.template);
    const tplName = $('#currentTemplateName');
    if (tplName) tplName.textContent = CVT.name(data.template);

  }

  /* =========================================================
     DATE FORMATTING
  ========================================================= */

  function fmt(d) {

    if (!d) {
      return '';
    }

    const [
      y,
      m
    ] =
      String(d).split('-');

    const months = [

      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'

    ];

    return (
      y &&
      m
    )

      ? `${months[
          +m - 1
        ] || m} ${y}`

      : d;

  }

  function range(
    a,
    b,
    current = false
  ) {

    const x =
      fmt(a);

    const y =
      current
        ? 'Present'
        : fmt(b);

    return (
      x &&
      y
    )

      ? `${x} – ${y}`

      : (
          x ||
          y ||
          ''
        );

  }

  /* =========================================================
     CV SECTION
  ========================================================= */

  function sec(
    title,
    body
  ) {

    return body

      ? `

        <section
          class="cv-section"
        >

          <h3>
            ${title}
          </h3>

          ${body}

        </section>

      `

      : '';

  }

  /* =========================================================
     CV ENTRY
  ========================================================= */

  function entry(
    title,
    meta,
    org,
    loc,
    desc,
    link
  ) {

    return `

      <article
        class="cv-entry"
      >

        <div
          class="cv-entry-head"
        >

          <div
            class="cv-entry-title"
          >
            ${esc(title)}
          </div>

          <div
            class="cv-entry-meta"
          >
            ${esc(meta)}
          </div>

        </div>

        ${
          org

            ? `<div
                 class="cv-entry-org"
               >
                 ${esc(org)}
               </div>`

            : ''
        }

        ${
          loc

            ? `<div
                 class="cv-entry-location"
               >
                 ${esc(loc)}
               </div>`

            : ''
        }

        ${
          desc

            ? `<div
                 class="cv-entry-description"
               >
                 ${nl(desc)}
               </div>`

            : ''
        }

        ${
          link

            ? `<div
                 class="cv-entry-description"
               >

                 <a
                   class="cv-link"
                   href="${esc(link)}"
                   target="_blank"
                   rel="noopener"
                 >
                   ${esc(link)}
                 </a>

               </div>`

            : ''
        }

      </article>

    `;

  }

  /* =========================================================
     BUILD CV CONTENT
  ========================================================= */

  function content() {

    const p =
      data.personal || {};

    let h = `

      <header
        class="cv-page-header"
      >

        ${
          data.photo

            ? `<img
                 class="cv-photo"
                 src="${data.photo}"
                 alt="Profile photo"
               >`

            : ''
        }

        <h1
          class="cv-name"
        >
          ${esc(
            p.fullName ||
            'Your Name'
          )}
        </h1>

        ${
          p.professionalTitle

            ? `<div
                 class="cv-title"
               >
                 ${esc(
                   p.professionalTitle
                 )}
               </div>`

            : ''
        }

        <div
          class="cv-contact"
        >

          ${
            [
              p.email,
              p.phone,
              p.location,
              p.website,
              p.linkedin,
              p.otherLink
            ]

              .filter(Boolean)

              .map(
                x =>
                  `<span>
                     ${esc(x)}
                   </span>`
              )

              .join('')
          }

        </div>

      </header>

    `;

    /* SUMMARY */

    if (data.summary) {

      h += sec(
        'Professional Summary',

        `
          <div
            class="cv-summary"
          >
            ${nl(
              data.summary
            )}
          </div>
        `
      );

    }

    /* WORK EXPERIENCE */

    if (
      data.experience.length
    ) {

      h += sec(

        'Work Experience',

        data.experience

          .map(
            x =>
              entry(
                x.position,
                range(
                  x.start,
                  x.end,
                  x.current
                ),
                x.company,
                x.location,
                x.description
              )
          )

          .join('')

      );

    }

    /* EDUCATION */

    if (
      data.education.length
    ) {

      h += sec(

        'Education',

        data.education

          .map(
            x =>
              entry(
                x.qualification,
                range(
                  x.start,
                  x.end
                ),
                x.institution,
                x.field,
                x.description
              )
          )

          .join('')

      );

    }

    /* SKILLS */

    if (
      data.skills.length
    ) {

      h += sec(

        'Skills',

        `

          <div
            class="cv-skills"
          >

            ${
              data.skills

                .map(
                  x =>
                    `<span
                       class="cv-skill"
                     >

                       ${esc(x.name)}

                       ${
                         x.level

                           ? ` · ${esc(
                               x.level
                             )}`

                           : ''
                       }

                     </span>`
                )

                .join('')
            }

          </div>

        `

      );

    }

    /* ACHIEVEMENTS */

    if (
      data.achievements.length
    ) {

      h += sec(

        'Achievements & Awards',

        data.achievements

          .map(
            x =>
              entry(
                x.title,
                x.date,
                x.organization,
                '',
                x.description
              )
          )

          .join('')

      );

    }

    /* VOLUNTEER / ATTACHMENTS / INTERNSHIPS */

    if (
      data.volunteer.length
    ) {

      h += sec(

        'Volunteer Work / Attachments / Internships',

        data.volunteer

          .map(
            x =>
              entry(
                x.role,
                range(
                  x.start,
                  x.end
                ),
                x.organization,
                [
                  x.type,
                  x.location
                ]
                  .filter(Boolean)
                  .join(' · '),
                x.description
              )
          )

          .join('')

      );

    }

    /* MEMBERSHIPS */

    if (
      data.memberships.length
    ) {

      h += sec(

        'Memberships & Professional Bodies',

        data.memberships

          .map(
            x =>
              entry(
                x.body,
                x.date,
                x.role,
                '',
                x.description
              )
          )

          .join('')

      );

    }

    /* CERTIFICATIONS */

    if (
      data.certifications.length
    ) {

      h += sec(

        'Courses / Training / Certificates',

        data.certifications

          .map(
            x =>
              entry(
                x.name,
                x.date,
                x.issuer,
                x.credential,
                x.description
              )
          )

          .join('')

      );

    }

    /* PROJECTS */

    if (
      data.projects.length
    ) {

      h += sec(

        'Projects',

        data.projects

          .map(
            x =>
              entry(
                x.name,
                x.date,
                x.role,
                '',
                x.description,
                x.link
              )
          )

          .join('')

      );

    }

    /* PUBLICATIONS */

    if (
      data.publications.length
    ) {

      h += sec(

        'Publications',

        data.publications

          .map(
            x =>
              entry(
                x.title,
                x.date,
                x.publisher,
                '',
                x.description,
                x.link
              )
          )

          .join('')

      );

    }

    /* LANGUAGES */

    if (
      data.languages.length
    ) {

      h += sec(

        'Languages',

        `

          <div
            class="cv-languages"
          >

            ${
              data.languages

                .map(
                  x =>
                    `<div
                       class="cv-language"
                     >

                       <strong>
                         ${esc(x.name)}
                       </strong>

                       <span>
                         ${esc(x.level)}
                       </span>

                     </div>`
                )

                .join('')
            }

          </div>

        `

      );

    }

    /* HOBBIES */

    if (data.interests) {

      h += sec(

        'Hobbies & Interests',

        `

          <div
            class="cv-inline-list"
          >

            ${
              data.interests

                .split(',')

                .map(
                  x =>
                    esc(
                      x.trim()
                    )
                )

                .filter(Boolean)

                .join(' · ')
            }

          </div>

        `

      );

    }

    /* REFEREES */

    if (
      data.refereesOnRequest
    ) {

      h += sec(

        'Referees',

        `
          <div
            class="cv-inline-list"
          >
            Referees available on request.
          </div>
        `

      );

    } else if (
      data.referees.length
    ) {

      h += sec(

        'Referees',

        `

          <div
            class="cv-referees"
          >

            ${
              data.referees

                .map(
                  x =>
                    `

                    <div
                      class="cv-referee"
                    >

                      <strong>
                        ${esc(x.name)}
                      </strong>

                      <br>

                      ${esc(x.title)}

                      ${
                        x.institution

                          ? ` · ${esc(
                              x.institution
                            )}`

                          : ''
                      }

                      <br>

                      ${esc(x.phone)}

                      ${
                        x.email

                          ? ` · ${esc(
                              x.email
                            )}`

                          : ''
                      }

                    </div>

                    `
                )

                .join('')
            }

          </div>

        `

      );

    }

    return h;

  }

  /* =========================================================
     CONVERT MILLIMETERS TO PIXELS
  ========================================================= */

  function mmPx(mm) {

    const d =
      document.createElement(
        'div'
      );

    d.style.cssText =
      `
        position:absolute;
        visibility:hidden;
        width:${mm}mm;
      `;

    document.body.appendChild(d);

    const n =
      d.getBoundingClientRect()
        .width;

    d.remove();

    return n;

  }

  /* =========================================================
     CREATE EMPTY A4 PAGE
  ========================================================= */

  function page() {

    const p =
      document.createElement(
        'div'
      );

    p.className =
      'cv-page';

    p.dataset.template = CVT.normalize(data.template);

    p.innerHTML =
      `
        <div
          class="cv-page-content"
        ></div>
      `;

    return p;

  }

  /* =========================================================
     OUTPUT STYLES (preview overlay + isolated print root)
  ========================================================= */
  function injectOutputStyles() {
    if ($('#cvOutputStyles')) return;
    const s = document.createElement('style');
    s.id = 'cvOutputStyles';
    s.textContent = `
      #cvPreviewOverlay{position:fixed;inset:0;z-index:99999;background:#e9ece9;display:flex;flex-direction:column;font-family:Inter,Arial,sans-serif}
      #cvPreviewOverlay .pv-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:#fff;border-bottom:1px solid #d9ddd9}
      #cvPreviewOverlay .pv-title{display:flex;flex-direction:column;min-width:0}
      #cvPreviewOverlay .pv-title strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #cvPreviewOverlay .pv-title span{font-size:12px;color:#667}
      #cvPreviewOverlay .pv-actions{display:flex;gap:8px;flex:0 0 auto}
      #cvPreviewOverlay .pv-btn{border:0;border-radius:8px;padding:10px 16px;font:600 13px Inter,Arial,sans-serif;cursor:pointer;background:var(--cv-primary,#15803d);color:#fff}
      #cvPreviewOverlay .pv-btn.pv-ghost{background:#eef0ee;color:#222}
      #cvPreviewOverlay .pv-btn:disabled{opacity:.6;cursor:wait}
      #cvPreviewOverlay .pv-scroll{flex:1;overflow:auto;padding:16px 12px 40px}
      #cvPreviewOverlay .pv-sizer{margin:0 auto}
      #cvPreviewOverlay .pv-inner{width:210mm;display:flex;flex-direction:column;gap:18px;transform-origin:top left}
      #cvPrintRoot{display:none}
      @media print{
        body>*:not(#cvPrintRoot){display:none!important}
        #cvPrintRoot{display:block!important}
        #cvPrintRoot,#cvPrintRoot *{visibility:visible!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        html,body{margin:0!important;padding:0!important;height:auto!important;overflow:visible!important;background:#fff!important}
        #cvPrintRoot .cv-page{width:210mm!important;height:296mm!important;min-height:296mm!important;margin:0!important;box-shadow:none!important;page-break-after:always;break-after:page}
        #cvPrintRoot .cv-page:last-child{page-break-after:auto;break-after:auto}
      }`;
    document.head.appendChild(s);
  }

  /* =========================================================
     RENDER A4 PAGES (entry-level pagination, unlimited pages)
  ========================================================= */
  function render() {
    injectCVStyles();
    injectOutputStyles();
    collect();
    setAppearance();
    renderSkills();
    updateCompletion();
    counter();

    const root = $('#cvPages');
    if (!root) return;
    root.innerHTML = '';

    const src = document.createElement('div');
    src.innerHTML = content();

    let pg, body, shell, shellSrc;

    const newPage = () => {
      pg = page();
      root.appendChild(pg);
      body = $('.cv-page-content', pg);
      shell = shellSrc = null;
    };
    const overflow = () => body.scrollHeight > body.clientHeight + 1;

    const startShell = (sec, cont) => {
      shell = sec.cloneNode(false);
      shellSrc = sec;
      const h = $('h3', sec).cloneNode(true);
      if (cont) h.textContent += ' (continued)';
      shell.appendChild(h);
      body.appendChild(shell);
    };

    const tryPlace = (node, sec, cont) => {
      let el;
      if (sec) {
        if (shellSrc !== sec) startShell(sec, cont);
        el = node.cloneNode(true);
        shell.appendChild(el);
      } else {
        el = node.cloneNode(true);
        body.appendChild(el);
        shell = shellSrc = null;
      }
      if (!overflow()) return true;
      if (body.children.length === 1 && (!sec || shell.children.length === 2)) return true;
      el.remove();
      if (sec && shell.children.length === 1) { shell.remove(); shell = shellSrc = null; }
      return false;
    };

    newPage();

    [...src.children].forEach(node => {
      const entries = node.classList.contains('cv-section')
        ? [...node.children].filter(c => c.classList.contains('cv-entry'))
        : [];

      if (entries.length > 1) {
        entries.forEach((en, i) => {
          if (!tryPlace(en, node, false)) {
            newPage();
            tryPlace(en, node, i > 0);
          }
        });
      } else if (!tryPlace(node, null, false)) {
        newPage();
        tryPlace(node, null, false);
      }
    });

    const pages = $$('.cv-page', root);
    pages.forEach((p, i) => {
      const f = document.createElement('div');
      f.className = 'cv-page-footer';
      f.textContent = `Page ${i + 1} of ${pages.length}`;
      p.appendChild(f);
    });

    const label = $('#pageCountLabel');
    if (label) label.textContent = `${pages.length} page${pages.length === 1 ? '' : 's'}`;

    applyZoom();
  }

  /* =========================================================
     FULL-SCREEN PREVIEW
  ========================================================= */
  function closePreview() {
    $('#cvPreviewOverlay')?.remove();
    document.body.style.overflow = '';
    window.removeEventListener('resize', fitPreview);
    document.removeEventListener('keydown', previewKey);
  }
  function previewKey(e) { if (e.key === 'Escape') closePreview(); }
  function fitPreview() {
    const ov = $('#cvPreviewOverlay');
    if (!ov) return;
    const scroll = $('.pv-scroll', ov), sizer = $('.pv-sizer', ov), inner = $('.pv-inner', ov);
    inner.style.transform = 'none';
    const w = inner.offsetWidth, h = inner.offsetHeight;
    const s = Math.min(1, (scroll.clientWidth - 24) / w);
    inner.style.transform = `scale(${s})`;
    sizer.style.width = w * s + 'px';
    sizer.style.height = h * s + 'px';
  }
  function openPreview() {
    render();
    closePreview();
    const pages = $$('#cvPages .cv-page');
    const ov = document.createElement('div');
    ov.id = 'cvPreviewOverlay';
    ov.innerHTML = `
      <div class="pv-bar">
        <div class="pv-title"><strong>${esc(data.cv_title || 'My CV')}</strong>
          <span>${pages.length} page${pages.length === 1 ? '' : 's'} · A4</span></div>
        <div class="pv-actions">
          <button type="button" class="pv-btn" id="pvDownload">Download PDF</button>
          <button type="button" class="pv-btn pv-ghost" id="pvClose">Close</button>
        </div>
      </div>
      <div class="pv-scroll"><div class="pv-sizer"><div class="pv-inner"></div></div></div>`;
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    const inner = $('.pv-inner', ov);
    pages.forEach(p => inner.appendChild(p.cloneNode(true)));
    $('#pvClose', ov).onclick = closePreview;
    $('#pvDownload', ov).onclick = downloadPDF;
    window.addEventListener('resize', fitPreview);
    document.addEventListener('keydown', previewKey);
    fitPreview();
  }

  /* =========================================================
     PDF DOWNLOAD (real file, with print fallback)
  ========================================================= */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }
  async function loadLibs() {
    if (!window.html2canvas)
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if (!window.jspdf)
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
  function fileName() {
    return (data.cv_title || 'CV').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'CV';
  }

  let downloading = false;
  async function downloadPDF() {
    if (downloading) return;
    downloading = true;
    const btns = [$('#downloadBtn'), $('#pvDownload')].filter(Boolean);
    const labels = btns.map(b => b.innerHTML);
    btns.forEach(b => { b.disabled = true; b.textContent = 'Preparing PDF…'; });
    let stage;
    try {
      render();
      save();
      await loadLibs();
      if (document.fonts?.ready) await document.fonts.ready;

      const pages = $$('#cvPages .cv-page');
      if (!pages.length) throw new Error('No pages to export');

      stage = document.createElement('div');
      stage.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;background:#fff;';
      document.body.appendChild(stage);

      const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

      for (let i = 0; i < pages.length; i++) {
        const clone = pages[i].cloneNode(true);
        clone.style.boxShadow = 'none';
        clone.style.margin = '0';
        stage.innerHTML = '';
        stage.appendChild(clone);
        const canvas = await window.html2canvas(clone, {
          scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false
        });
        if (i > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      pdf.save(fileName() + '.pdf');
      toast('PDF downloaded', `${pages.length} page${pages.length === 1 ? '' : 's'} saved.`);
    } catch (err) {
      console.error('PDF export failed:', err);
      toast('Using print instead', 'Choose "Save as PDF" in the print dialog.', 'error');
      setTimeout(() => window.print(), 300);
    } finally {
      stage?.remove();
      btns.forEach((b, i) => { b.disabled = false; b.innerHTML = labels[i]; });
      downloading = false;
    }
  }

  function buildPrintRoot() {
    removePrintRoot();
    const r = document.createElement('div');
    r.id = 'cvPrintRoot';
    $$('#cvPages .cv-page').forEach(p => r.appendChild(p.cloneNode(true)));
    document.body.appendChild(r);
  }
  function removePrintRoot() { $('#cvPrintRoot')?.remove(); }

  /* =========================================================
     ZOOM
  ========================================================= */

  function applyZoom() {

    const pages =
      $('#cvPages');

    if (pages) {

      pages.style.transform =
        `scale(${zoom})`;

    }

    const zoomValue =
      $('#zoomValue');

    if (zoomValue) {

      zoomValue.textContent =
        `${Math.round(
          zoom * 100
        )}%`;

    }

  }

  /* =========================================================
     SUMMARY COUNTER
  ========================================================= */

  function counter() {

    const summary =
      $('#summary');

    const counterEl =
      $('#summaryCounter');

    if (
      summary &&
      counterEl
    ) {

      counterEl.textContent =
        `${summary.value.length} / 1000`;

    }

  }

  /* =========================================================
     COMPLETION PERCENTAGE
  ========================================================= */

  function updateCompletion() {

    const p =
      data.personal || {};

    const checks = [

      p.fullName,

      p.email,

      data.summary,

      data.experience.length,

      data.education.length,

      data.skills.length,

      data.achievements.length,

      data.volunteer.length,

      data.memberships.length,

      data.certifications.length,

      data.projects.length,

      data.publications.length,

      data.languages.length,

      data.interests,

      data.refereesOnRequest ||
        data.referees.length

    ];

    const completed =
      checks.filter(
        Boolean
      ).length;

    const percentage =
      Math.round(
        completed /
        checks.length *
        100
      );

    const percent =
      $('#completionPercent');

    const bar =
      $('#completionBar');

    if (percent) {

      percent.textContent =
        percentage + '%';

    }

    if (bar) {

      bar.style.width =
        percentage + '%';

    }

  }

  /* =========================================================
     SAVE
  ========================================================= */

  function save(
    show = false
  ) {

    collect();

    data.updated_at =
      new Date().toISOString();

    try {

      localStorage.setItem(
        PREFIX + cvId,
        JSON.stringify(data)
      );

      localStorage.setItem(

        CURRENT,

        JSON.stringify({

          cv_id:
            data.cv_id,

          cv_title:
            data.cv_title,

          template:
            data.template,

          primary_color:
            data.primary_color,

          font:
            data.font,

          updated_at:
            data.updated_at

        })

      );

      setStatus(
        'Saved',
        'cloud_done'
      );

      if (show) {

        toast(
          'CV saved',
          'Your changes have been saved.'
        );

      }

    } catch (e) {

      console.error(
        'Could not save CV:',
        e
      );

      setStatus(
        'Save failed',
        'error'
      );

      toast(
        'Save failed',
        'Your browser could not save the CV.',
        'error'
      );

    }

  }

  /* =========================================================
     AUTO SAVE
  ========================================================= */

  function schedule() {

    setStatus(
      'Saving...',
      'sync'
    );

    clearTimeout(
      saveTimer
    );

    saveTimer =
      setTimeout(
        () => {

          save();

          pushHistory(
            true
          );

        },
        500
      );

  }

  /* =========================================================
     SAVE STATUS
  ========================================================= */

  function setStatus(
    t,
    i
  ) {

    const el =
      $('#saveStatus');

    if (!el) {
      return;
    }

    el.innerHTML = `

      <span class="material-icons">
        ${i}
      </span>

      ${esc(t)}

    `;

  }

  /* =========================================================
     HISTORY
  ========================================================= */

  function snapshot() {

    return JSON.stringify(
      data
    );

  }

  function pushHistory(
    collectIt = true
  ) {

    if (collectIt) {

      collect();

    }

    const s =
      snapshot();

    if (
      history[historyIndex] ===
      s
    ) {

      return;

    }

    history =
      history.slice(
        0,
        historyIndex + 1
      );

    history.push(s);

    if (
      history.length > 30
    ) {

      history.shift();

    }

    historyIndex =
      history.length - 1;

  }

  function restore(i) {

    if (
      i < 0 ||
      i >= history.length
    ) {

      return;

    }

    historyIndex =
      i;

    data =
      JSON.parse(
        history[i]
      );

    populate();

    render();

    save();

  }

  /* =========================================================
     SECTION NAVIGATION
  ========================================================= */

  function showSection(
    name
  ) {

    $$('.editor-section')
      .forEach(
        section => {

          section.classList.toggle(
            'active',
            section.dataset.section ===
              name
          );

        }
      );

    $$('.editor-nav-item')
      .forEach(
        button => {

          button.classList.toggle(
            'active',
            button.dataset.section ===
              name
          );

        }
      );

    if (
      innerWidth < 1200
    ) {

      closeSidebar();

    }

    $('.editor-workspace')
      ?.scrollTo({

        top: 0,

        behavior: 'smooth'

      });

  }

  /* =========================================================
     CLOSE SIDEBAR
  ========================================================= */

  function closeSidebar() {

    $('#editorSidebar')
      ?.classList
      .remove('open');

    $('#sidebarOverlay')
      ?.classList
      .remove('active');

  }

  /* =========================================================
     TOAST
  ========================================================= */

  function toast(
    title,
    msg,
    type = 'success'
  ) {

    const titleEl =
      $('#toastTitle');

    const messageEl =
      $('#toastMessage');

    const iconEl =
      $('#toastIcon');

    const toastEl =
      $('#editorToast');

    if (
      titleEl
    ) {

      titleEl.textContent =
        title;

    }

    if (
      messageEl
    ) {

      messageEl.textContent =
        msg;

    }

    if (
      iconEl
    ) {

      iconEl.textContent =
        type === 'error'
          ? 'error'
          : 'check_circle';

    }

    if (
      toastEl
    ) {

      toastEl.classList.add(
        'show'
      );

      clearTimeout(
        window.cvToast
      );

      window.cvToast =
        setTimeout(
          () => {

            toastEl.classList.remove(
              'show'
            );

          },
          3000
        );

    }

  }

  /* =========================================================
     LOAD ACCOUNT
  ========================================================= */

  function loadAccount() {

    try {

      const u =
        JSON.parse(
          localStorage.getItem(
            'cvbuilder_user'
          ) || 'null'
        );

      if (!u) {
        return;
      }

      const n =
        u.name ||
        u.fullName ||
        u.username ||
        u.email ||
        'User';

      if (
        $('#topUserName')
      ) {

        $('#topUserName')
          .textContent = n;

      }

      if (
        $('#topAvatar')
      ) {

        $('#topAvatar')
          .textContent =
          n
            .charAt(0)
            .toUpperCase();

      }

    } catch (e) {

      console.error(
        'Could not load account:',
        e
      );

    }

  }

  /* =========================================================
     EVENTS
  ========================================================= */

  function events() {

    /* Navigation */

    $$('.editor-nav-item')
      .forEach(
        button => {

          button.onclick =
            () =>
              showSection(
                button.dataset.section
              );

        }
      );

    /* Next */

    $$('.next-section-btn')
      .forEach(
        button => {

          button.onclick =
            () =>
              showSection(
                button.dataset.next
              );

        }
      );

    /* Previous */

    $$('.prev-section-btn')
      .forEach(
        button => {

          button.onclick =
            () =>
              showSection(
                button.dataset.prev
              );

        }
      );

    /* Add repeatable items */

    Object.keys(
      containers
    ).forEach(
      type => {

        const id =
          '#add' +
          type.charAt(0)
            .toUpperCase() +
          type.slice(1) +
          'Btn';

        $(id)
          ?.addEventListener(
            'click',
            () =>
              add(type)
          );

      }
    );

    /* Add skill */

    $('#addSkillBtn')
      ?.addEventListener(
        'click',
        addSkill
      );

    /* Form changes */

    document.addEventListener(
      'input',
      e => {

        if (
          e.target.matches(
            'input,textarea,select'
          )
        ) {

          collect();

          render();

          schedule();

        }

      }
    );

    document.addEventListener(
      'change',
      e => {

        if (
          e.target.matches(
            'input,textarea,select'
          )
        ) {

          collect();

          render();

          schedule();

        }

      }
    );

    /* CV title */

    $('#cvTitle')
      ?.addEventListener(
        'input',
        () => {

          data.cv_title =
            text('#cvTitle');

          schedule();

        }
      );

    /* Zoom in */

    $('#zoomInBtn')
      ?.addEventListener(
        'click',
        () => {

          zoom =
            Math.min(
              1.4,
              zoom + .1
            );

          applyZoom();

        }
      );

    /* Zoom out */

    $('#zoomOutBtn')
      ?.addEventListener(
        'click',
        () => {

          zoom =
            Math.max(
              .6,
              zoom - .1
            );

          applyZoom();

        }
      );

    /* Preview */
    $('#previewBtn')?.addEventListener('click', openPreview);

    /* Finish */
    $('#finishBtn')?.addEventListener('click', () => {
      save(true);
      openPreview();
    });

    /* Download PDF */
    $('#downloadBtn')?.addEventListener('click', downloadPDF);

    /* Fullscreen */

    $('#fullscreenPreviewBtn')
      ?.addEventListener(
        'click',
        () => {

          if (
            !document.fullscreenElement
          ) {

            $('#previewPanel')
              ?.requestFullscreen?.();

          } else {

            document
              .exitFullscreen?.();

          }

        }
      );

    /* Mobile sidebar */

    $('#mobileMenuBtn')
      ?.addEventListener(
        'click',
        () => {

          $('#editorSidebar')
            ?.classList
            .add('open');

          $('#sidebarOverlay')
            ?.classList
            .add('active');

        }
      );

    $('#sidebarClose')
      ?.addEventListener(
        'click',
        closeSidebar
      );

    $('#sidebarOverlay')
      ?.addEventListener(
        'click',
        closeSidebar
      );

    /* Profile dropdown */

    $('#profileMiniBtn')
      ?.addEventListener(
        'click',
        e => {

          e.stopPropagation();

          $('#profileDropdown')
            ?.classList
            .toggle('active');

        }
      );

    document.addEventListener(
      'click',
      e => {

        if (
          !e.target.closest(
            '.profile-wrapper'
          )
        ) {

          $('#profileDropdown')
            ?.classList
            .remove('active');

        }

      }
    );

    /* Logout */

    $('#logoutBtn')
      ?.addEventListener(
        'click',
        () => {

          localStorage.removeItem(
            'cvbuilder_user'
          );

          localStorage.removeItem(
            CURRENT
          );

          localStorage.removeItem(
            'current_cv_id'
          );

          location.href =
            'login.html';

        }
      );

    /* Close toast */

    $('#closeToastBtn')
      ?.addEventListener(
        'click',
        () => {

          $('#editorToast')
            ?.classList
            .remove('show');

        }
      );

    /* Undo */

    $('#undoBtn')
      ?.addEventListener(
        'click',
        () =>
          restore(
            historyIndex - 1
          )
      );

    /* Redo */

    $('#redoBtn')
      ?.addEventListener(
        'click',
        () =>
          restore(
            historyIndex + 1
          )
      );

    /* Photo upload */

    $('#photoInput')
      ?.addEventListener(
        'change',
        e => {

          const f =
            e.target.files?.[0];

          if (!f) {
            return;
          }

          if (
            f.size >
            5 * 1024 * 1024
          ) {

            toast(
              'Photo too large',
              'Maximum size is 5MB.',
              'error'
            );

            return;

          }

          const reader =
            new FileReader();

          reader.onload =
            () => {

              data.photo =
                reader.result;

              renderPhoto();

              render();

              schedule();

            };

          reader.readAsDataURL(
            f
          );

        }
      );

    /* Remove photo */

    $('#removePhotoBtn')
      ?.addEventListener(
        'click',
        () => {

          data.photo =
            '';

          renderPhoto();

          render();

          schedule();

        }
      );

    /* Print (Ctrl+P and fallback) */
    window.addEventListener('beforeprint', () => {
      collect();
      render();
      buildPrintRoot();
    });
    window.addEventListener('afterprint', removePrintRoot);

    /* Warm up PDF libraries */
    setTimeout(() => loadLibs().catch(() => {}), 1500);

  }

  /* =========================================================
     START APPLICATION
  ========================================================= */

  data.primary_color =
    meta().primary_color ||
    data.primary_color;

  data.font =
    meta().font ||
    data.font;

  /*
    First inject A4 styles.
  */

  injectCVStyles();

  /*
    Load CV.
  */

  load();

  /*
    Bind delete buttons.
  */

  bindDeletes();

  /*
    Bind events.
  */

  events();

  /*
    Final render.
  */

  render();

})();