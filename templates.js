/* =========================================================
   TEMPLATES.JS
   Handles template previews, filtering, modal display,
   and the "Use This Template" button.
========================================================= */


/* =========================================================
   SAMPLE PROFILE IMAGE
========================================================= */

const av = function (color) {
    return "data:image/svg+xml;utf8," + encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
        "<rect width='100' height='100' fill='" + color + "'/>" +
        "<circle cx='50' cy='38' r='17' fill='#fff' opacity='.92'/>" +
        "<path d='M14 100c0-24 16-38 36-38s36 14 36 38z' fill='#fff' opacity='.92'/>" +
        "</svg>"
    );
};


/* =========================================================
   SAMPLE CV DATA
========================================================= */

const D = {
    dev: {
        n: "Felix Odhiambo",
        t: "Web Developer & Graphic Designer",
        e: "felix.odhiambo@email.com",
        p: "+254 712 345 678",
        l: "Nairobi, Kenya",

        s: "Web developer with 5 years of experience building fast, responsive websites and brand identities for small businesses and startups. Skilled in HTML, CSS, JavaScript and Figma, with a record of delivering projects on time and improving client engagement.",

        x: [
            {
                r: "Web Developer",
                c: "BrightPath Digital, Nairobi",
                d: "2022 – Present",
                b: [
                    "Built and maintained 25+ client websites, cutting average page load time by 40%.",
                    "Led the redesign of an online store that raised monthly orders by 32%."
                ]
            },
            {
                r: "Graphic Designer",
                c: "Pixel House Studio, Nairobi",
                d: "2019 – 2022",
                b: [
                    "Designed logos, brochures and social media kits for more than 60 clients.",
                    "Trained 4 junior designers on Adobe Illustrator and brand guidelines."
                ]
            }
        ],

        u: [
            {
                d: "BSc Information Technology",
                s: "University of Nairobi",
                y: "2015 – 2019"
            }
        ],

        k: [
            "HTML5 & CSS3",
            "JavaScript",
            "React",
            "Figma",
            "Adobe Illustrator",
            "SEO Basics",
            "Git & GitHub"
        ],

        lv: [95, 90, 80, 85, 88, 75, 82],

        lg: [
            "English – Fluent",
            "Kiswahili – Native"
        ],

        a: [
            "Google UX Design Certificate (2021)",
            "Best Junior Designer Award, Pixel House Studio (2020)"
        ],

        g: [
            [
                "Web Development",
                "Built responsive, accessible websites with HTML, CSS, JavaScript and React, optimised for speed and search engines."
            ],
            [
                "Graphic Design",
                "Created logos, brand kits and marketing materials in Illustrator, Photoshop and Figma for 60+ clients."
            ],
            [
                "Communication & Teamwork",
                "Gathered requirements directly from clients and mentored junior designers."
            ]
        ],

        st: [
            ["5+", "Years experience"],
            ["60+", "Clients served"],
            ["25+", "Websites built"]
        ],

        ts: "Frontend developer with 5 years of experience turning Figma designs into fast, accessible React websites. Proven record of improving page speed and conversions for growing businesses.",

        m: [
            [
                "React & modern JavaScript",
                "Built 25+ websites; rebuilt an online store in React, raising orders by 32%."
            ],
            [
                "Performance & SEO",
                "Cut average page load time by 40% across client projects."
            ],
            [
                "Design collaboration",
                "Turn Figma designs into pixel-perfect code, backed by 3 years as a graphic designer."
            ]
        ]
    },

    des: {
        n: "Amina Hassan",
        t: "Creative Director & Motion Designer",
        e: "amina@hassanstudio.co.ke",
        p: "+254 722 118 904",
        l: "Mombasa, Kenya",

        s: "Award-nominated creative with 8 years in branding, video and motion graphics. I turn bold ideas into visuals people remember, from TV commercials to music-video titles.",

        x: [
            {
                r: "Creative Director",
                c: "Coastline Media, Mombasa",
                d: "2021 – Present",
                b: [
                    "Lead 7 designers and editors delivering 40+ campaigns a year.",
                    "Directed a tourism campaign that reached 2.3M viewers online."
                ]
            },
            {
                r: "Motion Designer",
                c: "Reel Africa Productions",
                d: "2017 – 2021",
                b: [
                    "Produced title sequences and animated ads for 3 regional TV networks.",
                    "Cut video turnaround by 30% with a reusable template library."
                ]
            }
        ],

        u: [
            {
                d: "Diploma in Graphic Design & Animation",
                s: "Coast Institute of Creative Arts",
                y: "2014 – 2016"
            }
        ],

        k: [
            "After Effects",
            "Premiere Pro",
            "Illustrator",
            "Photoshop",
            "Cinema 4D",
            "Storyboarding"
        ]
    },

    fin: {
        n: "Daniel Otieno",
        t: "Senior Financial Analyst",
        e: "daniel.otieno@email.com",
        p: "+254 733 456 210",
        l: "Nairobi, Kenya",

        s: "Finance professional with 9 years in commercial banking and corporate finance. Experienced in financial modelling, risk assessment and regulatory reporting.",

        x: [
            {
                r: "Senior Financial Analyst",
                c: "Equity Trust Bank, Nairobi",
                d: "2019 – Present",
                b: [
                    "Prepare monthly forecasts and variance reports for a KES 4.5 billion loan portfolio.",
                    "Identified KES 38 million in savings through budget restructuring."
                ]
            },
            {
                r: "Financial Analyst",
                c: "Savanna Capital Ltd, Nairobi",
                d: "2015 – 2019",
                b: [
                    "Built valuation models used in 12 corporate transactions.",
                    "Ensured full compliance with regulatory reporting requirements."
                ]
            }
        ],

        u: [
            {
                d: "Bachelor of Commerce (Finance)",
                s: "Strathmore University",
                y: "2010 – 2014"
            }
        ],

        k: [
            "Financial Modelling",
            "Risk Analysis",
            "IFRS Reporting",
            "Advanced Excel",
            "Power BI",
            "Budgeting"
        ],

        a: [
            "Certified Public Accountant (CPA-K)",
            "CFA Level II Candidate"
        ]
    },

    acad: {
        n: "Dr. Grace Wanjiru",
        t: "Senior Lecturer, Computer Science",
        e: "g.wanjiru@lakeview.ac.ke",
        p: "+254 700 222 333",
        l: "Nairobi, Kenya",

        s: "Researcher and educator in machine learning and health informatics with 12 years of university teaching and 20+ peer-reviewed publications.",

        x: [
            {
                r: "Senior Lecturer",
                c: "Dept. of Computer Science, Lakeview University",
                d: "2018 – Present",
                b: [
                    "Teach Machine Learning, Data Structures and Research Methods to 300+ students a year.",
                    "Supervised 9 MSc and 3 PhD students to completion."
                ]
            },
            {
                r: "Lecturer",
                c: "Dept. of Computer Science, Lakeview University",
                d: "2013 – 2018",
                b: [
                    "Designed a new undergraduate course in Health Informatics.",
                    "Secured a KES 6 million research grant for a rural diagnostics project."
                ]
            }
        ],

        u: [
            {
                d: "PhD, Computer Science",
                s: "University of Cape Town",
                y: "2009 – 2013"
            },
            {
                d: "MSc, Computer Science",
                s: "University of Nairobi",
                y: "2006 – 2008"
            }
        ],

        k: [
            "Machine Learning",
            "Health Informatics",
            "Explainable AI",
            "Data Science Education"
        ],

        pub: [
            "Wanjiru, G. & Otieno, P. (2023). Predicting maternal health risks with machine learning in low-resource clinics. Journal of Health Informatics in Africa, 12(2), 45–58.",
            "Wanjiru, G. (2021). Explainable AI for rural diagnostics. African Journal of Computing, 9(1), 112–125.",
            "Wanjiru, G., Kimani, L. & Achieng, R. (2019). A survey of data quality in county health records. Proceedings of the East Africa Computing Conference, 201–209."
        ],

        a: [
            "Best Young Researcher Award, Lakeview University (2019)",
            "Member, Kenya Computer Society"
        ]
    },

    exe: {
        n: "James Mwangi",
        t: "Chief Operating Officer",
        e: "james.mwangi@email.com",
        p: "+254 711 908 765",
        l: "Nairobi, Kenya",

        s: "Results-driven executive with 18 years leading operations across East Africa in manufacturing and logistics. Track record of scaling businesses, driving profitability and building high-performing leadership teams.",

        x: [
            {
                r: "Chief Operating Officer",
                c: "Lakeside Logistics Group",
                d: "2018 – Present",
                b: [
                    "Grew annual revenue from KES 1.2B to KES 3.4B in five years.",
                    "Reduced operating costs by 22% through supply chain restructuring.",
                    "Lead 850 employees across 5 countries."
                ]
            },
            {
                r: "Regional Operations Director",
                c: "Rift Manufacturing Ltd",
                d: "2011 – 2018",
                b: [
                    "Opened 3 regional plants on time and 8% under budget.",
                    "Introduced lean processes that improved productivity by 27%."
                ]
            }
        ],

        u: [
            {
                d: "MBA, Strategic Management",
                s: "Strathmore Business School",
                y: "2008 – 2010"
            },
            {
                d: "BSc Mechanical Engineering",
                s: "University of Nairobi",
                y: "1999 – 2003"
            }
        ],

        k: [
            "Strategic Planning",
            "P&L Management",
            "Change Leadership",
            "M&A Integration",
            "Board Reporting"
        ],

        st: [
            ["3x", "Revenue growth"],
            ["22%", "Cost reduction"],
            ["850", "People led"]
        ],

        a: [
            "Board Member, Kenya Association of Manufacturers (2020 – Present)",
            "Fellow, Institute of Directors"
        ]
    }
};


/* =========================================================
   HTML HELPERS
========================================================= */

const li = function (items) {
    if (!items || !items.length) {
        return "";
    }

    return (
        "<ul>" +
        items.map(function (item) {
            return "<li>" + item + "</li>";
        }).join("") +
        "</ul>"
    );
};

const S = function (heading, content) {
    return (
        "<section>" +
        "<h3>" + heading + "</h3>" +
        content +
        "</section>"
    );
};

const jobs = function (person) {
    return (person.x || []).map(function (job) {
        return `
            <div class="job">
                <div class="jh">
                    <b>${job.r}</b>
                    <i>${job.d}</i>
                </div>
                <div class="jc">${job.c}</div>
                ${li(job.b)}
            </div>
        `;
    }).join("");
};

const edu = function (person) {
    return (person.u || []).map(function (education) {
        return `
            <div class="job">
                <div class="jh">
                    <b>${education.d}</b>
                    <i>${education.y}</i>
                </div>
                <div class="jc">${education.s}</div>
            </div>
        `;
    }).join("");
};

const cl = function (person) {
    return [
        person.e,
        person.p,
        person.l
    ].join(" &nbsp;•&nbsp; ");
};

const ic = function (icon, text) {
    return `
        <div class="ci">
            <span class="material-icons">${icon}</span>
            ${text}
        </div>
    `;
};

const con = function (person) {
    return (
        ic("mail", person.e) +
        ic("phone", person.p) +
        ic("place", person.l)
    );
};

const head = function (person) {
    return `
        <header>
            <h1>${person.n}</h1>
            <div class="tt">${person.t}</div>
            <div class="cl">${cl(person)}</div>
        </header>
    `;
};

const chips = function (items) {
    return (
        '<div class="chips">' +
        (items || []).map(function (item) {
            return "<span>" + item + "</span>";
        }).join("") +
        "</div>"
    );
};


/* =========================================================
   TEMPLATE DEFINITIONS

   These template IDs must match cv-templates.js.
========================================================= */

const T = {
    chronological: {
        name: "Chronological",
        cat: "professional",
        tag: "Popular",
        desc: "Most common. Latest job first. For people with steady job history.",

        r: function () {
            const P = D.dev;

            return `
                <div class="cv t1">
                    ${head(P)}
                    ${S("Professional Summary", `<p>${P.s}</p>`)}
                    ${S("Work Experience", jobs(P))}
                    ${S("Education", edu(P))}
                    ${S("Skills", `<p>${P.k.join(" • ")}</p>`)}
                </div>
            `;
        }
    },

    functional: {
        name: "Functional",
        cat: "professional",
        desc: "Focuses on skills, not dates. For students, career changers and employment gaps.",

        r: function () {
            const P = D.dev;

            return `
                <div class="cv t2">
                    ${head(P)}
                    ${S("Professional Summary", `<p>${P.s}</p>`)}
                    ${S(
                        "Key Skills & Accomplishments",
                        (P.g || []).map(function (group) {
                            return `
                                <div class="job">
                                    <b>${group[0]}</b>
                                    <p>${group[1]}</p>
                                </div>
                            `;
                        }).join("")
                    )}
                    ${S("Education", edu(P))}
                </div>
            `;
        }
    },

    hybrid: {
        name: "Combination / Hybrid",
        cat: "professional",
        desc: "Combines a skills section with a detailed work history.",

        r: function () {
            const P = D.dev;

            return `
                <div class="cv t3">
                    ${head(P)}
                    ${S("Profile", `<p>${P.s}</p>`)}
                    ${S("Core Skills", chips(P.k))}
                    ${S("Work Experience", jobs(P))}
                    ${S("Education", edu(P))}
                </div>
            `;
        }
    },

    targeted: {
        name: "Targeted / Job-Specific",
        cat: "professional",
        desc: "Highlights the skills and experience most relevant to a particular job.",

        r: function () {
            const P = D.dev;

            return `
                <div class="cv t4">
                    ${head(P)}
                    ${S("Targeted Profile", `<p>${P.ts || P.s}</p>`)}
                    ${S("Relevant Strengths", chips(P.k))}
                    ${S("Selected Achievements", li(P.a || []))}
                    ${S("Experience", jobs(P))}
                </div>
            `;
        }
    },

    modern: {
        name: "Modern",
        cat: "modern",
        tag: "New",
        desc: "A clean, modern design with strong headings and balanced spacing.",

        r: function () {
            const P = D.dev;

            return `
                <div class="cv t5">
                    ${head(P)}
                    ${S("About Me", `<p>${P.s}</p>`)}
                    ${S("Experience", jobs(P))}
                    ${S("Education", edu(P))}
                    ${S("Technical Skills", chips(P.k))}
                </div>
            `;
        }
    },

    corporate: {
        name: "Professional / Corporate",
        cat: "professional",
        desc: "Structured layout suitable for business and corporate applications.",

        r: function () {
            const P = D.fin;

            return `
                <div class="cv t6">
                    ${head(P)}
                    ${S("Professional Profile", `<p>${P.s}</p>`)}
                    ${S("Professional Experience", jobs(P))}
                    ${S("Education", edu(P))}
                    ${S("Technical Skills", chips(P.k))}
                    ${S("Certifications", li(P.a || []))}
                </div>
            `;
        }
    },

    minimalist: {
        name: "Minimalist / Simple",
        cat: "simple",
        desc: "Simple, readable and distraction-free.",

        r: function () {
            const P = D.dev;

            return `
                <div class="cv t7">
                    ${head(P)}
                    ${S("Summary", `<p>${P.s}</p>`)}
                    ${S("Experience", jobs(P))}
                    ${S("Education", edu(P))}
                    ${S("Skills", `<p>${P.k.join(", ")}</p>`)}
                </div>
            `;
        }
    },

    creative: {
        name: "Creative",
        cat: "creative",
        desc: "Designed for designers, artists, media professionals and creative roles.",

        r: function () {
            const P = D.des;

            return `
                <div class="cv t8">
                    ${head(P)}
                    ${S("Creative Profile", `<p>${P.s}</p>`)}
                    ${S("Creative Experience", jobs(P))}
                    ${S("Education", edu(P))}
                    ${S("Tools & Skills", chips(P.k))}
                </div>
            `;
        }
    },

    academic: {
        name: "Academic / CV",
        cat: "academic",
        desc: "Includes education, publications, research and academic experience.",

        r: function () {
            const P = D.acad;

            return `
                <div class="cv t9">
                    ${head(P)}
                    ${S("Academic Profile", `<p>${P.s}</p>`)}
                    ${S("Academic Experience", jobs(P))}
                    ${S("Education", edu(P))}
                    ${S("Research Areas", chips(P.k))}
                    ${S("Publications", li(P.pub || []))}
                    ${S("Awards & Memberships", li(P.a || []))}
                </div>
            `;
        }
    },

    infographic: {
        name: "Infographic / Visual",
        cat: "creative",
        desc: "Uses visual sections, skills bars and timeline elements.",

        r: function () {
            const P = D.dev;

            return `
                <div class="cv t10">
                    <div class="side">
                        <div class="avatar">${av("#16a34a")}</div>
                        <h2>${P.n}</h2>
                        <div class="tt">${P.t}</div>
                        ${S("Contact", con(P))}
                        ${S(
                            "Skills",
                            P.k.map(function (skill, index) {
                                return `
                                    <div class="bar">
                                        ${skill}
                                        <div>
                                            <i style="width:${P.lv[index] || 0}%"></i>
                                        </div>
                                    </div>
                                `;
                            }).join("")
                        )}
                    </div>

                    <div class="mn">
                        <h1>${P.n}</h1>
                        <div class="tt">${P.t}</div>
                        ${S("Profile", `<p>${P.s}</p>`)}
                        ${S("Career Timeline", jobs(P))}
                        ${S("Education", edu(P))}
                    </div>
                </div>
            `;
        }
    },

    executive: {
        name: "Executive",
        cat: "professional",
        desc: "Focuses on leadership, achievements, strategy and business results.",

        r: function () {
            const P = D.exe;

            return `
                <div class="cv t11">
                    <div class="top">
                        <h1>${P.n}</h1>
                        <div class="tt">${P.t}</div>
                        <div class="cl">${cl(P)}</div>
                    </div>

                    <div class="bd">
                        ${S("Executive Summary", `<p>${P.s}</p>`)}

                        <div class="hl">
                            ${(P.st || []).map(function (stat) {
                                return `
                                    <div>
                                        <b>${stat[0]}</b>
                                        ${stat[1]}
                                    </div>
                                `;
                            }).join("")}
                        </div>

                        ${S("Leadership Experience", jobs(P))}
                        ${S("Core Competencies", chips(P.k))}
                        ${S("Education", edu(P))}
                        ${S("Board & Memberships", li(P.a || []))}
                    </div>
                </div>
            `;
        }
    },

    ats: {
        name: "ATS-Friendly",
        cat: "simple",
        tag: "Recommended",
        desc: "Plain-text structure with no complex layout, tables or images.",

        r: function () {
            const P = D.dev;

            return `
                <div class="cv t12">
                    ${head(P)}
                    ${S("Summary", `<p>${P.s}</p>`)}
                    ${S("Skills", `<p>${P.k.join(", ")}</p>`)}
                    ${S("Work Experience", jobs(P))}
                    ${S("Education", edu(P))}
                    ${S("Certifications", li(P.a || []))}
                </div>
            `;
        }
    }
};


/* =========================================================
   BUILD TEMPLATE CARDS
========================================================= */

const grid = document.getElementById("templatesGrid");

if (grid) {
    grid.innerHTML = Object.entries(T).map(function (entry) {
        const key = entry[0];
        const template = entry[1];

        return `
            <article
                class="template-card"
                data-category="${template.cat}"
                data-name="${template.name}"
            >
                <div class="cv-thumb">
                    ${
                        template.tag
                            ? `<div class="cv-label">${template.tag}</div>`
                            : ""
                    }

                    ${template.r()}
                </div>

                <div class="template-card-info">
                    <div>
                        <h3>${template.name}</h3>
                        <p>${template.desc}</p>
                    </div>

                    <button
                        type="button"
                        class="preview-btn"
                        data-template="${key}"
                    >
                        <span class="material-icons">visibility</span>
                        Preview
                    </button>
                </div>
            </article>
        `;
    }).join("");
}


/* =========================================================
   FIT CV PREVIEWS
========================================================= */

function fit(box) {
    const cv = box.querySelector(".cv");

    if (!cv || !box.clientWidth) {
        return;
    }

    const scale = box.clientWidth / 794;

    cv.style.transform = "scale(" + scale + ")";

    if (box.dataset.auto) {
        box.style.height =
            cv.offsetHeight * scale + "px";
    }
}

function fitAll() {
    document
        .querySelectorAll(".cv-thumb, .cv-modal-view")
        .forEach(fit);
}

fitAll();

window.addEventListener("resize", fitAll);
window.addEventListener("load", fitAll);


/* =========================================================
   USER INFORMATION
========================================================= */

try {
    const user = JSON.parse(
        localStorage.getItem("cvbuilder_user") || "null"
    );

    const userName = document.getElementById("userName");

    if (user && userName) {
        userName.textContent =
            user.name ||
            user.full_name ||
            "User";
    }
} catch (error) {
    console.log("User information could not be loaded.");
}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay =
    document.getElementById("sidebarOverlay");
const mobileMenu = document.getElementById("mobileMenu");

if (mobileMenu && sidebar && sidebarOverlay) {
    mobileMenu.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        sidebarOverlay.classList.toggle("show");
    });

    sidebarOverlay.addEventListener("click", function () {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("show");
    });
}


/* =========================================================
   PROFILE DROPDOWN
========================================================= */

const profileDropdown =
    document.getElementById("profileDropdown");
const profileMini = document.getElementById("profileMini");

if (profileMini && profileDropdown) {
    profileMini.addEventListener("click", function (event) {
        event.stopPropagation();
        profileDropdown.classList.toggle("show");
    });

    document.addEventListener("click", function () {
        profileDropdown.classList.remove("show");
    });
}


/* =========================================================
   SEARCH AND CATEGORY FILTER
========================================================= */

const searchInput =
    document.getElementById("templateSearch");

const noResults =
    document.getElementById("noResults");

const filterButtons =
    document.querySelectorAll(".filter-btn");

function filterTemplates() {
    if (!searchInput) {
        return;
    }

    const query = searchInput.value
        .toLowerCase()
        .trim();

    const activeButton =
        document.querySelector(".filter-btn.active");

    const activeCategory =
        activeButton
            ? activeButton.dataset.category
            : "all";

    let visible = 0;

    document
        .querySelectorAll(".template-card")
        .forEach(function (card) {
            const name =
                (card.dataset.name || "").toLowerCase();

            const category =
                (card.dataset.category || "").toLowerCase();

            const show =
                (name.includes(query) ||
                    category.includes(query)) &&
                (activeCategory === "all" ||
                    category === activeCategory);

            card.style.display =
                show ? "block" : "none";

            if (show) {
                visible++;
            }
        });

    if (noResults) {
        noResults.classList.toggle(
            "show",
            visible === 0
        );
    }

    fitAll();
}

if (searchInput) {
    searchInput.addEventListener(
        "input",
        filterTemplates
    );
}

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        filterButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        this.classList.add("active");

        filterTemplates();
    });
});


/* =========================================================
   PREVIEW MODAL
========================================================= */

const previewModal =
    document.getElementById("previewModal");

const modalView =
    document.getElementById("largeCvPreview");

let selectedTemplate = "modern";

function closePreviewModal() {
    if (!previewModal) {
        return;
    }

    previewModal.classList.remove("show");
    document.body.classList.remove("modal-open");
}

document
    .querySelectorAll(".preview-btn")
    .forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            selectedTemplate =
                this.dataset.template || "modern";

            const template = T[selectedTemplate];

            if (!template || !modalView) {
                return;
            }

            const modalTitle =
                document.getElementById("modalTitle");

            const modalDescription =
                document.getElementById("modalDescription");

            if (modalTitle) {
                modalTitle.textContent =
                    template.name;
            }

            if (modalDescription) {
                modalDescription.textContent =
                    template.desc;
            }

            modalView.innerHTML =
                template.r();

            if (previewModal) {
                previewModal.classList.add("show");
            }

            document.body.classList.add("modal-open");

            fit(modalView);
        });
    });

const closeModal =
    document.getElementById("closeModal");

const modalCancel =
    document.getElementById("modalCancel");

const modalOverlay =
    document.getElementById("modalOverlay");

if (closeModal) {
    closeModal.addEventListener(
        "click",
        closePreviewModal
    );
}

if (modalCancel) {
    modalCancel.addEventListener(
        "click",
        closePreviewModal
    );
}

if (modalOverlay) {
    modalOverlay.addEventListener(
        "click",
        closePreviewModal
    );
}

document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        previewModal &&
        previewModal.classList.contains("show")
    ) {
        closePreviewModal();
    }
});


/* =========================================================
   USE THIS TEMPLATE
========================================================= */

const useTemplateButton =
    document.getElementById("useTemplate");

if (useTemplateButton) {
    useTemplateButton.setAttribute(
        "type",
        "button"
    );

    useTemplateButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();

            if (
                !window.CVTemplates ||
                typeof window.CVTemplates.start !== "function"
            ) {
                console.error(
                    "cv-templates.js is missing or loaded after templates.js."
                );

                alert(
                    "The CV editor could not be opened. Please check that cv-templates.js is included before templates.js."
                );

                return;
            }

            window.CVTemplates.start({
                template: selectedTemplate,
                title: "My Professional CV",
                color: "#16a34a",
                font: "Inter"
            });
        }
    );
}


/* =========================================================
   LOGOUT AND FOOTER YEAR
========================================================= */

function logout() {
    localStorage.removeItem("cvbuilder_user");
    localStorage.removeItem("current_cv");

    window.location.href = "login.html";
}

const logoutButton =
    document.getElementById("logoutBtn");

const dropdownLogoutButton =
    document.getElementById("dropdownLogout");

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        logout
    );
}

if (dropdownLogoutButton) {
    dropdownLogoutButton.addEventListener(
        "click",
        logout
    );
}

const currentYear =
    document.getElementById("currentYear");

if (currentYear) {
    currentYear.textContent =
        new Date().getFullYear();
}