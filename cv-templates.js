/* =========================================================
   CV-TEMPLATES.JS

   Shared template manager.

   This file must load BEFORE:

   - create cv.js
   - templates.js
   - editor.js

   Example:

   <script src="auth.js"></script>
   <script src="cv-templates.js"></script>
   <script src="create cv.js"></script>
========================================================= */

(function () {
    "use strict";

    const CURRENT_STORAGE_KEY = "current_cv";
    const DEFAULT_TEMPLATE = "modern";


    /* =====================================================
       AVAILABLE TEMPLATE LIST
    ===================================================== */

    const TEMPLATE_LIST = [
        {
            id: "chronological",
            name: "Chronological"
        },
        {
            id: "functional",
            name: "Functional"
        },
        {
            id: "hybrid",
            name: "Combination / Hybrid"
        },
        {
            id: "targeted",
            name: "Targeted / Job-Specific"
        },
        {
            id: "modern",
            name: "Modern"
        },
        {
            id: "corporate",
            name: "Professional / Corporate"
        },
        {
            id: "minimalist",
            name: "Minimalist / Simple"
        },
        {
            id: "creative",
            name: "Creative"
        },
        {
            id: "academic",
            name: "Academic / CV"
        },
        {
            id: "infographic",
            name: "Infographic / Visual"
        },
        {
            id: "executive",
            name: "Executive"
        },
        {
            id: "ats",
            name: "ATS-Friendly"
        }
    ];


    /* =====================================================
       OLD TEMPLATE NAME ALIASES
    ===================================================== */

    const TEMPLATE_ALIASES = {
        classic: "chronological",
        traditional: "chronological",
        professional: "corporate",
        simple: "minimalist",
        "modern professional": "modern"
    };


    /* =====================================================
       CREATE QUICK LOOKUP OBJECT
    ===================================================== */

    const templateById = {};

    TEMPLATE_LIST.forEach(function (template) {
        templateById[template.id] = template;
    });


    /* =====================================================
       NORMALIZE TEMPLATE ID
    ===================================================== */

    function normalizeTemplateId(templateId) {
        const key = String(templateId || "")
            .trim()
            .toLowerCase();

        if (templateById[key]) {
            return key;
        }

        if (TEMPLATE_ALIASES[key]) {
            return TEMPLATE_ALIASES[key];
        }

        return DEFAULT_TEMPLATE;
    }


    /* =====================================================
       GET TEMPLATE NAME
    ===================================================== */

    function getTemplateName(templateId) {
        const normalizedId =
            normalizeTemplateId(templateId);

        return templateById[normalizedId].name;
    }


    /* =====================================================
       CREATE CV AND OPEN EDITOR
    ===================================================== */

    function start(options) {
        options = options || {};

        const now = new Date().toISOString();

        const cvId =
            "CV" +
            Date.now() +
            Math.random()
                .toString(36)
                .substring(2, 7);

        const record = {
            cv_id: cvId,

            cv_title:
                options.title ||
                "My Professional CV",

            template:
                normalizeTemplateId(
                    options.template
                ),

            primary_color:
                options.color ||
                "#16a34a",

            font:
                options.font ||
                "Inter",

            created_at: now,
            updated_at: now
        };


        /* ==============================================
           SAVE TEMPORARY CV DATA
           The editor.js file can read current_cv.
        ============================================== */

        localStorage.setItem(
            CURRENT_STORAGE_KEY,
            JSON.stringify(record)
        );


        /* ==============================================
           OPEN THE EDITOR PAGE
        ============================================== */

        window.location.href =
            "editor.html?id=" +
            encodeURIComponent(cvId);

        return record;
    }


    /* =====================================================
       EXPOSE SHARED API
    ===================================================== */

    window.CVTemplates = {
        list: TEMPLATE_LIST,
        normalize: normalizeTemplateId,
        name: getTemplateName,
        start: start
    };

})();