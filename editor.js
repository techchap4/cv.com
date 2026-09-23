/* CVBuilder editor — self-contained editor for all 12 templates */
(() => {
"use strict";

const STORAGE = "current_cv";
const DATA_KEY = "cvbuilder_editor_data";

const TEMPLATES = [
  ["chronological", "Chronological"],
  ["functional", "Functional"],
  ["hybrid", "Combination / Hybrid"],
  ["targeted", "Targeted / Job-Specific"],
  ["modern", "Modern"],
  ["corporate", "Professional / Corporate"],
  ["minimalist", "Minimalist / Simple"],
  ["creative", "Creative"],
  ["academic", "Academic / CV"],
  ["infographic", "Infographic / Visual"],
  ["executive", "Executive"],
  ["ats", "ATS-Friendly"]
];

const sample = {
  name: "Felix Odhiambo",
  title: "Web Developer & Graphic Designer",
  email: "felix.odhiambo@email.com",
  phone: "+254 712 345 678",
  location: "Nairobi, Kenya",

  summary:
    "Web developer with 5 years of experience building fast, responsive websites and brand identities for small businesses and startups. Skilled in HTML, CSS, JavaScript and Figma, with a record of delivering projects on time and improving client engagement.",

  experience: [
    {
      role: "Web Developer",
      company: "BrightPath Digital, Nairobi",
      dates: "2022 – Present",
      description:
        "Built and maintained client websites, improved performance and led a major online-store redesign."
    },
    {
      role: "Graphic Designer",
      company: "Pixel House Studio, Nairobi",
      dates: "2019 – 2022",
      description:
        "Designed logos, brochures and social media kits for clients and trained junior designers."
    }
  ],

  education: [
    {
      degree: "BSc Information Technology",
      school: "University of Nairobi",
      dates: "2015 – 2019"
    }
  ],

  skills: [
    "HTML5 & CSS3",
    "JavaScript",
    "React",
    "Figma",
    "Adobe Illustrator",
    "SEO Basics",
    "Git & GitHub"
  ],

  awards: [
    "Google UX Design Certificate (2021)",
    "Best Junior Designer Award (2020)"
  ],

  languages: "English — Fluent, Kiswahili — Native",

  publications: [
    "Responsive web development and accessible interface design"
  ],

  targetedSummary:
    "Web developer focused on responsive interfaces, performance, accessibility and practical business outcomes.",

  photo: ""
};

let state = loadState();
let zoom = 0.8;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];


/* =========================================================
   HELPERS
========================================================= */

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function lines(value = "") {
  return String(value)
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalize(id) {
  const aliases = {
    classic: "chronological",
    traditional: "chronological",
    professional: "corporate",
    simple: "minimalist",
    "modern professional": "modern"
  };

  id = String(id || "").toLowerCase().trim();

  return TEMPLATES.some(template => template[0] === id)
    ? id
    : (aliases[id] || "modern");
}


/* =========================================================
   STORAGE
========================================================= */

function loadState() {
  let base = {
    ...sample,
    cv_title: "My Professional CV",
    template: "modern",
    primary_color: "#16a34a",
    font: "Inter"
  };

  try {
    const savedEditor = JSON.parse(
      localStorage.getItem(DATA_KEY) || "{}"
    );

    Object.assign(base, savedEditor);
  } catch (error) {
    console.warn("Could not load editor data:", error);
  }

  try {
    const currentCV = JSON.parse(
      localStorage.getItem(STORAGE) || "{}"
    );

    if (currentCV.template) {
      base.template = normalize(currentCV.template);
    }

    if (currentCV.cv_title) {
      base.cv_title = currentCV.cv_title;
    }

    if (currentCV.primary_color) {
      base.primary_color = currentCV.primary_color;
    }

    if (currentCV.font) {
      base.font = currentCV.font;
    }
  } catch (error) {
    console.warn("Could not load current CV:", error);
  }

  return base;
}

function saveState() {
  const currentCV = JSON.parse(
    localStorage.getItem(STORAGE) || "{}"
  );

  const merged = {
    ...currentCV,
    ...state,
    cv_title: state.cv_title,
    template: state.template,
    primary_color: state.primary_color,
    font: state.font,
    updated_at: new Date().toISOString()
  };

  localStorage.setItem(
    STORAGE,
    JSON.stringify(merged)
  );

  localStorage.setItem(
    DATA_KEY,
    JSON.stringify(state)
  );

  setSaveStatus("Saved");
}

let saveTimer;

function debounceSave() {
  setSaveStatus("Saving…");

  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    saveState();
  }, 500);
}

function setSaveStatus(text) {
  const element = $("#saveStatus");

  if (!element) return;

  element.innerHTML = `
    <span class="material-icons">
      ${text === "Saved" ? "cloud_done" : "sync"}
    </span>
    ${text}
  `;
}


/* =========================================================
   INITIALIZATION
========================================================= */

function init() {

  $("#cvTitle").value =
    state.cv_title || "My Professional CV";

  $("#colorInput").value =
    state.primary_color || "#16a34a";

  $("#fontSelect").value =
    state.font || "Inter";

  buildTemplateControls();

  renderLists();

  bindFields();

  recombineSkills();

  bindUI();

  updatePhoto();

  render();
}


/* =========================================================
   TEMPLATE CONTROLS
========================================================= */

function buildTemplateControls() {

  const select = $("#templateSelect");
  const pills = $("#templatePills");

  if (!select || !pills) return;

  select.innerHTML = TEMPLATES
    .map(([id, name]) =>
      `<option value="${id}">${name}</option>`
    )
    .join("");

  select.value = normalize(state.template);

  pills.innerHTML = TEMPLATES
    .map(([id, name]) => `
      <button
        type="button"
        class="template-pill ${
          id === state.template ? "active" : ""
        }"
        data-template="${id}">
        ${name}
      </button>
    `)
    .join("");

  pills.addEventListener("click", event => {

    const button =
      event.target.closest("[data-template]");

    if (!button) return;

    setTemplate(button.dataset.template);
  });

  select.addEventListener("change", event => {
    setTemplate(event.target.value);
  });
}

function setTemplate(id) {

  state.template = normalize(id);

  $("#templateSelect").value =
    state.template;

  $$(".template-pill").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.template === state.template
    );

  });

  render();

  saveState();
}


/* =========================================================
   BASIC FORM FIELDS
========================================================= */

function recombineSkills() {

  // The Skills panel has two separate boxes
  // (Technical / Soft), but every template
  // renders a single flat state.skills list —
  // so keep that list in sync with both boxes
  // any time either one changes.
  state.skills = [
    ...lines(state.skillsTechnical || ""),
    ...lines(state.skillsSoft || "")
  ];
}

function bindFields() {

  // If this is the first time the Skills panel
  // is populated (e.g. fresh sample data, which
  // only has a flat state.skills array and no
  // skillsTechnical/skillsSoft text yet), seed
  // the Technical box from it so the panel and
  // the preview start in sync.
  if (
    state.skillsTechnical === undefined &&
    Array.isArray(state.skills) &&
    state.skills.length
  ) {
    state.skillsTechnical =
      state.skills.join(", ");
  }

  $$("[data-bind]").forEach(element => {

    const key = element.dataset.bind;

    if (key === "skills") {

      element.value =
        (state.skills || []).join(", ");

    } else if (Array.isArray(state[key])) {

      // Some sample fields (awards,
      // publications) start as arrays; show
      // them one per line rather than a raw
      // comma-joined string.
      element.value =
        state[key].join("\n");

    } else {

      element.value =
        state[key] || "";
    }

    element.addEventListener("input", () => {

      if (key === "skills") {

        state.skills =
          lines(element.value);

      } else {

        state[key] =
          element.value;

        if (
          key === "skillsTechnical" ||
          key === "skillsSoft"
        ) {
          recombineSkills();
        }
      }

      render();

      debounceSave();
    });
  });


  $("#cvTitle").addEventListener("input", () => {

    state.cv_title =
      $("#cvTitle").value;

    debounceSave();
  });


  $("#colorInput").addEventListener("input", () => {

    state.primary_color =
      $("#colorInput").value;

    render();

    debounceSave();
  });


  $("#fontSelect").addEventListener("change", () => {

    state.font =
      $("#fontSelect").value;

    render();

    saveState();
  });
}


/* =========================================================
   EXPERIENCE + EDUCATION
========================================================= */

function renderLists() {

  const experienceList =
    $("#experienceList");

  const educationList =
    $("#educationList");


  if (experienceList) {

    experienceList.innerHTML =
      (state.experience || [])
        .map((item, index) => `
          <div
            class="repeat-card"
            data-index="${index}">

            <button
              class="remove-repeat"
              data-remove-exp="${index}"
              type="button">

              <span class="material-icons">
                delete
              </span>

            </button>

            <div class="form-grid">

              <label class="field">
                <span>Job title</span>

                <input
                  data-exp="${index}"
                  data-key="role"
                  value="${esc(item.role)}">
              </label>


              <label class="field">
                <span>Company</span>

                <input
                  data-exp="${index}"
                  data-key="company"
                  value="${esc(item.company)}">
              </label>


              <label class="field">
                <span>Dates</span>

                <input
                  data-exp="${index}"
                  data-key="dates"
                  value="${esc(item.dates)}">
              </label>


              <label class="field full">

                <span>Description</span>

                <textarea
                  data-exp="${index}"
                  data-key="description"
                  rows="4">${esc(item.description)}</textarea>

              </label>

            </div>
          </div>
        `)
        .join("");
  }


  if (educationList) {

    educationList.innerHTML =
      (state.education || [])
        .map((item, index) => `
          <div class="repeat-card">

            <button
              class="remove-repeat"
              data-remove-edu="${index}"
              type="button">

              <span class="material-icons">
                delete
              </span>

            </button>

            <div class="form-grid">

              <label class="field">

                <span>
                  Degree / qualification
                </span>

                <input
                  data-edu="${index}"
                  data-key="degree"
                  value="${esc(item.degree)}">

              </label>


              <label class="field">

                <span>School</span>

                <input
                  data-edu="${index}"
                  data-key="school"
                  value="${esc(item.school)}">

              </label>


              <label class="field full">

                <span>Dates</span>

                <input
                  data-edu="${index}"
                  data-key="dates"
                  value="${esc(item.dates)}">

              </label>

            </div>
          </div>
        `)
        .join("");
  }


  $$("[data-exp]").forEach(element => {

    element.addEventListener("input", () => {

      const index =
        Number(element.dataset.exp);

      const key =
        element.dataset.key;

      state.experience[index][key] =
        element.value;

      render();

      debounceSave();
    });

  });


  $$("[data-edu]").forEach(element => {

    element.addEventListener("input", () => {

      const index =
        Number(element.dataset.edu);

      const key =
        element.dataset.key;

      state.education[index][key] =
        element.value;

      render();

      debounceSave();
    });

  });


  $$("[data-remove-exp]").forEach(button => {

    button.addEventListener("click", () => {

      const index =
        Number(button.dataset.removeExp);

      state.experience.splice(index, 1);

      renderLists();

      render();

      saveState();
    });

  });


  $$("[data-remove-edu]").forEach(button => {

    button.addEventListener("click", () => {

      const index =
        Number(button.dataset.removeEdu);

      state.education.splice(index, 1);

      renderLists();

      render();

      saveState();
    });

  });
}


/* =========================================================
   UI EVENTS
========================================================= */

function bindUI() {

  $$(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

      showPanel(
        button.dataset.section
      );

    });

  });


  $("#addExperience").addEventListener(
    "click",
    () => {

      state.experience.push({
        role: "New role",
        company: "Company",
        dates: "2025 – Present",
        description:
          "Describe your main achievements and responsibilities."
      });

      renderLists();

      render();

      saveState();
    }
  );


  $("#addEducation").addEventListener(
    "click",
    () => {

      state.education.push({
        degree: "Qualification",
        school: "Institution",
        dates: "2020 – 2024"
      });

      renderLists();

      render();

      saveState();
    }
  );


  $("#photoInput").addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      if (!file) return;

      if (file.size > 4 * 1024 * 1024) {

        toast(
          "Please use an image smaller than 4 MB."
        );

        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {

        state.photo =
          reader.result;

        updatePhoto();

        render();

        saveState();
      };

      reader.readAsDataURL(file);
    }
  );


  $("#removePhoto").addEventListener(
    "click",
    () => {

      state.photo = "";

      updatePhoto();

      render();

      saveState();
    }
  );


  $("#mobileMenu").addEventListener(
    "click",
    () => {

      $("#editorSidebar")
        .classList.add("open");
    }
  );


  $("#closeSidebar").addEventListener(
    "click",
    () => {

      $("#editorSidebar")
        .classList.remove("open");
    }
  );


  $("#previewToggle").addEventListener(
    "click",
    () => {

      const pane = $("#previewPane");

      const willExpand =
        !pane.classList.contains("expanded");

      pane.classList.toggle(
        "expanded",
        willExpand
      );

      // Fallback inline styling in case the
      // "expanded" state isn't defined in the
      // stylesheet on this page (e.g. on small
      // screens where the preview is hidden by
      // default) — guarantees the Preview button
      // always reveals the live preview.
      pane.style.display =
        willExpand ? "flex" : "";

      pane.style.position =
        willExpand ? "fixed" : "";

      pane.style.inset =
        willExpand ? "0" : "";

      pane.style.zIndex =
        willExpand ? "999" : "";

      pane.style.background =
        willExpand ? "#f3f4f6" : "";

      if (willExpand) {

        pane.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  );


  $("#downloadBtn").addEventListener(
    "click",
    downloadPDF
  );


  $("#zoomIn").addEventListener(
    "click",
    () => {

      setZoom(
        Math.min(1.2, zoom + 0.1)
      );
    }
  );


  $("#zoomOut").addEventListener(
    "click",
    () => {

      setZoom(
        Math.max(0.5, zoom - 0.1)
      );
    }
  );


  $("#newTemplateBtn").addEventListener(
    "click",
    () => {

      showPanel("design");
    }
  );


  $("#clearBtn").addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Clear all CV information?"
        )
      ) {
        return;
      }

      localStorage.removeItem(DATA_KEY);

      state = {
        ...sample,
        cv_title: "My Professional CV",
        template: "modern",
        primary_color: "#16a34a",
        font: "Inter",
        photo: ""
      };

      init();
    }
  );


  updatePhoto();
}


/* =========================================================
   PANELS
========================================================= */

function showPanel(id) {

  $$(".nav-item").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.section === id
    );

  });


  $$(".editor-section").forEach(panel => {

    panel.classList.toggle(
      "active",
      panel.dataset.panel === id
    );

  });


  $("#editorSidebar")
    .classList.remove("open");
}


/* =========================================================
   PHOTO
========================================================= */

function updatePhoto() {

  const box =
    $("#photoEditor");

  if (!box) return;

  if (state.photo) {

    box.innerHTML = `
      <img
        src="${state.photo}"
        alt="Profile">
    `;

  } else {

    box.innerHTML = `
      <span class="material-icons">
        person
      </span>
    `;
  }
}


/* =========================================================
   ZOOM
========================================================= */

function setZoom(value) {

  zoom = value;

  $("#zoomValue").textContent =
    Math.round(value * 100) + "%";

  $("#cvPreview")
    .style
    .setProperty(
      "--preview-scale",
      value
    );
}


/* =========================================================
   DOWNLOAD / PRINT TO PDF
========================================================= */

function safeFileName() {

  return (
    (state.cv_title || "CV")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "")
    || "CV"
  );
}

function downloadPDF() {

  const preview = $("#cvPreview");

  if (!preview) return;

  // Make sure the very latest edits are on the
  // page before exporting.
  render();

  const hasExportLibs =
    typeof window.html2canvas === "function" &&
    window.jspdf &&
    typeof window.jspdf.jsPDF === "function";

  if (hasExportLibs) {

    exportWithJsPDF(preview);

  } else {

    // Offline / CDN blocked fallback: use the
    // browser's own print-to-PDF dialog instead.
    toast(
      "Using your browser's print dialog to save the PDF."
    );

    printFallback(preview);
  }
}

function exportWithJsPDF(preview) {

  const button = $("#downloadBtn");

  const previousLabel =
    button ? button.innerHTML : "";

  if (button) {
    button.disabled = true;
    button.innerHTML =
      `<span class="material-icons">hourglass_top</span>Preparing PDF…`;
  }

  // Reset zoom so the exported page isn't scaled
  // down/up by the on-screen preview zoom.
  const previousTransform =
    preview.style.getPropertyValue(
      "--preview-scale"
    );

  preview.style.setProperty(
    "--preview-scale",
    1
  );

  document.body.classList.add(
    "cv-printing"
  );

  const restoreUI = () => {

    document.body.classList.remove(
      "cv-printing"
    );

    preview.style.setProperty(
      "--preview-scale",
      previousTransform || zoom
    );

    if (button) {
      button.disabled = false;
      button.innerHTML = previousLabel;
    }
  };

  // Give the browser a tick to apply the reset
  // scale / layout before rasterizing it.
  setTimeout(() => {

    window
      .html2canvas(preview, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: preview.scrollWidth,
        windowHeight: preview.scrollHeight
      })
      .then(canvas => {

        const { jsPDF } = window.jspdf;

        // Standard A4 page, in points.
        const pageWidth = 595.28;
        const pageHeight = 841.89;

        const pdf = new jsPDF({
          unit: "pt",
          format: "a4",
          orientation: "portrait"
        });

        const imageWidth = pageWidth;
        const imageHeight =
          (canvas.height * imageWidth) /
          canvas.width;

        const imageData =
          canvas.toDataURL("image/jpeg", 0.95);

        if (imageHeight <= pageHeight) {

          // Fits on a single page.
          pdf.addImage(
            imageData,
            "JPEG",
            0,
            0,
            imageWidth,
            imageHeight
          );

        } else {

          // CV overflows one page — slice the
          // tall canvas into page-sized chunks
          // so nothing gets cut off mid-line.
          const pxPerPt = canvas.width / imageWidth;
          const pageHeightPx = pageHeight * pxPerPt;

          let renderedPx = 0;
          let pageIndex = 0;

          while (renderedPx < canvas.height) {

            const sliceHeightPx = Math.min(
              pageHeightPx,
              canvas.height - renderedPx
            );

            const sliceCanvas =
              document.createElement("canvas");

            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceHeightPx;

            sliceCanvas
              .getContext("2d")
              .drawImage(
                canvas,
                0,
                renderedPx,
                canvas.width,
                sliceHeightPx,
                0,
                0,
                canvas.width,
                sliceHeightPx
              );

            const sliceData =
              sliceCanvas.toDataURL(
                "image/jpeg",
                0.95
              );

            if (pageIndex > 0) {
              pdf.addPage();
            }

            pdf.addImage(
              sliceData,
              "JPEG",
              0,
              0,
              imageWidth,
              (sliceHeightPx * imageWidth) /
                canvas.width
            );

            renderedPx += sliceHeightPx;
            pageIndex += 1;
          }
        }

        pdf.save(`${safeFileName()}.pdf`);

        restoreUI();
      })
      .catch(error => {

        console.warn(
          "PDF export failed, falling back to print:",
          error
        );

        toast(
          "Couldn't build the PDF directly — opening print dialog instead."
        );

        restoreUI();

        printFallback(preview);
      });

  }, 50);
}

function printFallback(preview) {

  const previousZoom = zoom;
  const previousTransform =
    preview.style.getPropertyValue(
      "--preview-scale"
    );

  preview.style.setProperty(
    "--preview-scale",
    1
  );

  // The printed file name is taken from the
  // document title by most browsers, so give it
  // a clean, CV-specific name for the duration
  // of the print job.
  const previousTitle = document.title;

  document.title = safeFileName();

  document.body.classList.add(
    "cv-printing"
  );

  const restore = () => {

    document.title = previousTitle;

    document.body.classList.remove(
      "cv-printing"
    );

    preview.style.setProperty(
      "--preview-scale",
      previousTransform || previousZoom
    );

    window.removeEventListener(
      "afterprint",
      restore
    );
  };

  window.addEventListener(
    "afterprint",
    restore
  );

  setTimeout(() => {

    window.print();

    // Some browsers (notably older Safari) don't
    // fire "afterprint" reliably, so also restore
    // shortly after triggering the dialog.
    setTimeout(restore, 1000);

  }, 50);
}


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

  const element =
    $("#toast");

  element.textContent =
    message;

  element.classList.add("show");

  setTimeout(() => {

    element.classList.remove("show");

  }, 2200);
}


/* =========================================================
   CV MARKUP
========================================================= */

function contact() {

  return [
    state.email,
    state.phone,
    state.location
  ]
    .filter(Boolean)
    .map(value =>
      `<span>${esc(value)}</span>`
    )
    .join(" <i>•</i> ");
}


function photo(className = "") {

  if (state.photo) {

    return `
      <img
        class="cv-photo ${className}"
        src="${state.photo}"
        alt="Profile photo">
    `;

  }

  return `
    <div
      class="cv-photo placeholder ${className}">

      <span class="material-icons">
        person
      </span>

    </div>
  `;
}


function jobs() {

  return (state.experience || [])
    .map(item => `

      <div class="cv-entry">

        <div class="cv-entry-top">

          <strong class="cv-entry-title">
            ${esc(item.role)}
          </strong>

          <span class="cv-entry-meta">
            ${esc(item.dates)}
          </span>

        </div>

        <div class="cv-entry-org">
          ${esc(item.company)}
        </div>

        <p class="cv-entry-description">
          ${esc(item.description)}
        </p>

      </div>

    `)
    .join("");
}


function education() {

  return (state.education || [])
    .map(item => `

      <div class="cv-entry">

        <div class="cv-entry-top">

          <strong class="cv-entry-title">
            ${esc(item.degree)}
          </strong>

          <span class="cv-entry-meta">
            ${esc(item.dates)}
          </span>

        </div>

        <div class="cv-entry-org">
          ${esc(item.school)}
        </div>

      </div>

    `)
    .join("");
}


function skills() {

  return `
    <div class="cv-skills">

      ${(state.skills || [])
        .map(skill => `
          <span class="cv-skill">
            ${esc(skill)}
          </span>
        `)
        .join("")}

    </div>
  `;
}


function section(title, body) {

  return `
    <section class="cv-section">

      <h3>
        ${title}
      </h3>

      ${body}

    </section>
  `;
}


function header(extra = "") {

  return `
    <header class="cv-page-header">

      ${extra}

      ${photo()}

      <div class="cv-name">
        ${esc(state.name || "Your Name")}
      </div>

      <div class="cv-title">
        ${esc(state.title || "Professional Title")}
      </div>

      <div class="cv-contact">
        ${contact()}
      </div>

    </header>
  `;
}


/* =========================================================
   STANDARD TEMPLATES
========================================================= */

function standardTemplate(id) {

  let body = "";


  /* CHRONOLOGICAL */

  if (id === "chronological") {

    body =
      header() +

      section(
        "Professional Summary",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Work Experience",
        jobs()
      ) +

      section(
        "Education",
        education()
      ) +

      section(
        "Skills",
        skills()
      );
  }


  /* FUNCTIONAL */

  if (id === "functional") {

    body =
      header() +

      section(
        "Professional Summary",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Key Skills & Accomplishments",

        (state.skills || [])
          .map(skill => `
            <div class="cv-entry">

              <strong class="cv-entry-title">
                ${esc(skill)}
              </strong>

              <p class="cv-entry-description">
                Demonstrated capability and practical
                experience using ${esc(skill)}.
              </p>

            </div>
          `)
          .join("")
      ) +

      section(
        "Education",
        education()
      );
  }


  /* HYBRID */

  if (id === "hybrid") {

    body =
      header() +

      section(
        "Profile",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Core Skills",
        skills()
      ) +

      section(
        "Work Experience",
        jobs()
      ) +

      section(
        "Education",
        education()
      );
  }


  /* TARGETED */

  if (id === "targeted") {

    body =
      header() +

      section(
        "Targeted Profile",
        `<p class="cv-summary">
          ${esc(
            state.targetedSummary ||
            state.summary
          )}
        </p>`
      ) +

      section(
        "Relevant Strengths",
        skills()
      ) +

      section(
        "Selected Achievements",

        `<ul class="cv-list">

          ${lines(state.awards)
            .map(item => `
              <li>
                ${esc(item)}
              </li>
            `)
            .join("")}

        </ul>`
      ) +

      section(
        "Experience",
        jobs()
      );
  }


  /* MODERN */

  if (id === "modern") {

    body =
      header() +

      section(
        "About Me",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Experience",
        jobs()
      ) +

      section(
        "Education",
        education()
      ) +

      section(
        "Technical Skills",
        skills()
      );
  }


  /* CORPORATE */

  if (id === "corporate") {

    body =
      header() +

      section(
        "Professional Profile",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Professional Experience",
        jobs()
      ) +

      section(
        "Education",
        education()
      ) +

      section(
        "Technical Skills",
        skills()
      ) +

      section(
        "Certifications",

        `<ul class="cv-list">

          ${lines(state.awards)
            .map(item => `
              <li>
                ${esc(item)}
              </li>
            `)
            .join("")}

        </ul>`
      );
  }


  /* MINIMALIST */

  if (id === "minimalist") {

    body =
      header() +

      section(
        "Summary",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Experience",
        jobs()
      ) +

      section(
        "Education",
        education()
      ) +

      section(
        "Skills",
        `<p>
          ${(state.skills || [])
            .map(esc)
            .join(", ")}
        </p>`
      );
  }


  /* CREATIVE */

  if (id === "creative") {

    body =
      header() +

      section(
        "Creative Profile",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Creative Experience",
        jobs()
      ) +

      section(
        "Education",
        education()
      ) +

      section(
        "Tools & Skills",
        skills()
      );
  }


  /* ACADEMIC */

  if (id === "academic") {

    body =
      header() +

      section(
        "Academic Profile",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Academic Experience",
        jobs()
      ) +

      section(
        "Education",
        education()
      ) +

      section(
        "Research Areas",
        skills()
      ) +

      section(
        "Publications",

        `<ul class="cv-list">

          ${lines(state.publications)
            .map(item => `
              <li>
                ${esc(item)}
              </li>
            `)
            .join("")}

        </ul>`
      ) +

      section(
        "Awards & Memberships",

        `<ul class="cv-list">

          ${lines(state.awards)
            .map(item => `
              <li>
                ${esc(item)}
              </li>
            `)
            .join("")}

        </ul>`
      );
  }


  /* ATS */

  if (id === "ats") {

    body =
      header() +

      section(
        "Summary",
        `<p class="cv-summary">
          ${esc(state.summary)}
        </p>`
      ) +

      section(
        "Skills",

        `<p>
          ${(state.skills || [])
            .map(esc)
            .join(", ")}
        </p>`
      ) +

      section(
        "Work Experience",
        jobs()
      ) +

      section(
        "Education",
        education()
      ) +

      section(
        "Certifications",

        `<ul class="cv-list">

          ${lines(state.awards)
            .map(item => `
              <li>
                ${esc(item)}
              </li>
            `)
            .join("")}

        </ul>`
      );
  }


  return body;
}


/* =========================================================
   INFOGRAPHIC TEMPLATE
========================================================= */

function infographic() {

  return `

    <div class="infographic-layout">

      <aside class="info-side">

        ${photo()}

        <div class="info-name">
          ${esc(state.name)}
        </div>

        <div class="info-title">
          ${esc(state.title)}
        </div>


        ${section(
          "Contact",

          `<div class="info-contact">
            ${contact()}
          </div>`
        )}


        ${section(
          "Skills",

          (state.skills || [])
            .map(skill => `

              <div class="skill-bar">

                <span>
                  ${esc(skill)}
                </span>

                <i></i>

              </div>

            `)
            .join("")
        )}

      </aside>


      <div class="info-main">

        <div class="info-main-head">

          <div class="cv-name">
            ${esc(state.name)}
          </div>

          <div class="cv-title">
            ${esc(state.title)}
          </div>

        </div>


        ${section(
          "Profile",

          `<p class="cv-summary">
            ${esc(state.summary)}
          </p>`
        )}


        ${section(
          "Career Timeline",
          jobs()
        )}


        ${section(
          "Education",
          education()
        )}

      </div>

    </div>
  `;
}


/* =========================================================
   EXECUTIVE TEMPLATE
========================================================= */

function executive() {

  return `

    <div class="executive-layout">

      <header class="exec-head">

        ${photo()}

        <div class="cv-name">
          ${esc(state.name)}
        </div>

        <div class="cv-title">
          ${esc(state.title)}
        </div>

        <div class="cv-contact">
          ${contact()}
        </div>

      </header>


      <div class="exec-body">

        ${section(
          "Executive Summary",

          `<p class="cv-summary">
            ${esc(state.summary)}
          </p>`
        )}


        <div class="exec-stats">

          <div>
            <b>5+</b>
            <span>Years experience</span>
          </div>

          <div>
            <b>${(state.experience || []).length}</b>
            <span>Roles</span>
          </div>

          <div>
            <b>${(state.skills || []).length}</b>
            <span>Core skills</span>
          </div>

        </div>


        ${section(
          "Leadership Experience",
          jobs()
        )}


        ${section(
          "Core Competencies",
          skills()
        )}


        ${section(
          "Education",
          education()
        )}


        ${section(
          "Board & Memberships",

          `<ul class="cv-list">

            ${lines(state.awards)
              .map(item => `
                <li>
                  ${esc(item)}
                </li>
              `)
              .join("")}

          </ul>`
        )}

      </div>

    </div>
  `;
}


/* =========================================================
   RENDER
========================================================= */

function render() {

  const id =
    normalize(state.template);

  const preview =
    $("#cvPreview");

  if (!preview) return;

  preview.dataset.template =
    id;

  preview.style.setProperty(
    "--cv-primary",
    state.primary_color || "#16a34a"
  );

  preview.style.setProperty(
    "--cv-font",
    `"${state.font || "Inter"}"`
  );

  if (id === "infographic") {

    preview.innerHTML =
      infographic();

  } else if (id === "executive") {

    preview.innerHTML =
      executive();

  } else {

    preview.innerHTML =
      standardTemplate(id);
  }


  const template =
    TEMPLATES.find(
      item => item[0] === id
    );

  $("#templateLabel").textContent =
    template
      ? template[1]
      : id;
}


/* =========================================================
   START EDITOR
========================================================= */

init();

})();