/* =========================================
   CREATE CV PAGE

   Load scripts in this order:

   <script src="auth.js"></script>
   <script src="cv-templates.js"></script>
   <script src="create cv.js"></script>
========================================= */

(function () {
    "use strict";

    /* =========================================
       USER INFORMATION
    ========================================= */

    const currentUser =
        window.CVBuilderAuth && typeof CVBuilderAuth.getUser === "function"
            ? CVBuilderAuth.getUser()
            : null;

    if (currentUser && window.CVBuilderAuth) {
        const name =
            typeof CVBuilderAuth.getUserName === "function"
                ? CVBuilderAuth.getUserName(currentUser)
                : currentUser.name || currentUser.full_name || "User";

        const userName = document.getElementById("userName");

        if (userName) {
            userName.textContent = name;
        }
    }


    /* =========================================
       CV TITLE CHARACTER COUNT
    ========================================= */

    const cvTitle = document.getElementById("cvTitle");
    const titleCount = document.getElementById("titleCount");

    if (cvTitle && titleCount) {
        cvTitle.addEventListener("input", function () {
            titleCount.textContent = this.value.length;
        });

        titleCount.textContent = cvTitle.value.length;
    }


    /* =========================================
       TEMPLATE SELECTION
    ========================================= */

    const templateCards = document.querySelectorAll(".template-card");

    function refreshTemplateCards() {
        templateCards.forEach(function (card) {
            const input = card.querySelector(
                'input[name="template"]'
            );

            if (!input) {
                return;
            }

            const isSelected = input.checked;

            card.classList.toggle("selected", isSelected);

            const icon = card.querySelector(
                ".template-info > .material-icons"
            );

            if (icon) {
                icon.textContent = isSelected
                    ? "check_circle"
                    : "radio_button_unchecked";
            }

            const preview = card.querySelector(".template-preview");
            let badge = card.querySelector(".selected-badge");

            if (isSelected && !badge && preview) {
                badge = document.createElement("div");
                badge.className = "selected-badge";
                badge.innerHTML =
                    '<span class="material-icons">check</span>';

                preview.appendChild(badge);
            }

            if (!isSelected && badge) {
                badge.remove();
            }
        });
    }

    templateCards.forEach(function (card) {
        const input = card.querySelector(
            'input[name="template"]'
        );

        if (!input) {
            return;
        }

        input.addEventListener("change", refreshTemplateCards);

        card.addEventListener("click", function (event) {
            if (event.target === input) {
                return;
            }

            input.checked = true;
            refreshTemplateCards();
        });

        card.setAttribute("tabindex", "0");

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                input.checked = true;
                refreshTemplateCards();
            }
        });
    });

    refreshTemplateCards();


    /* =========================================
       COLOR SELECTION
    ========================================= */

    const colorOptions = document.querySelectorAll(
        'input[name="color"]'
    );

    const selectedColor = document.getElementById("selectedColor");
    const customColor = document.getElementById("customColor");

    let usingCustomColor = false;

    colorOptions.forEach(function (input) {
        input.addEventListener("change", function () {
            usingCustomColor = false;

            document
                .querySelectorAll(".color-option")
                .forEach(function (option) {
                    option.classList.remove("selected-color");
                });

            const parentOption = this.closest(".color-option");

            if (parentOption) {
                parentOption.classList.add("selected-color");
            }

            if (selectedColor) {
                selectedColor.textContent =
                    this.value.toUpperCase();
            }

            if (customColor) {
                customColor.value = this.value;
            }
        });
    });


    /* =========================================
       CUSTOM COLOR
    ========================================= */

    if (customColor) {
        customColor.addEventListener("input", function () {
            usingCustomColor = true;

            colorOptions.forEach(function (input) {
                input.checked = false;
            });

            document
                .querySelectorAll(".color-option")
                .forEach(function (option) {
                    option.classList.remove("selected-color");
                });

            if (selectedColor) {
                selectedColor.textContent =
                    this.value.toUpperCase();
            }
        });
    }


    /* =========================================
       CONTINUE BUTTON
    ========================================= */

    const continueBtn = document.getElementById("continueBtn");

    if (continueBtn) {
        continueBtn.addEventListener("click", function (event) {
            event.preventDefault();

            if (!cvTitle) {
                alert("CV title field was not found.");
                return;
            }

            const title = cvTitle.value.trim();

            if (!title) {
                cvTitle.focus();
                alert("Please enter a name for your CV.");
                return;
            }

            const templateInput = document.querySelector(
                'input[name="template"]:checked'
            );

            if (!templateInput) {
                alert("Please choose a template.");
                return;
            }

            const selectedTemplate = templateInput.value;

            const checkedColor = document.querySelector(
                'input[name="color"]:checked'
            );

            let color = "#16a34a";

            if (usingCustomColor && customColor) {
                color = customColor.value;
            } else if (checkedColor) {
                color = checkedColor.value;
            } else if (customColor && customColor.value) {
                color = customColor.value;
            }

            const fontElement =
                document.getElementById("fontFamily");

            const font = fontElement
                ? fontElement.value
                : "Inter";

            if (
                !window.CVTemplates ||
                typeof window.CVTemplates.start !== "function"
            ) {
                console.error(
                    "CVTemplates is unavailable. Make sure cv-templates.js is loaded before create cv.js."
                );

                alert(
                    "The CV editor could not be opened. Please make sure cv-templates.js is included in your HTML file."
                );

                return;
            }

            window.CVTemplates.start({
                template: selectedTemplate,
                title: title,
                color: color,
                font: font
            });
        });
    }


    /* =========================================
       PROFILE DROPDOWN
    ========================================= */

    const profileMini = document.getElementById("profileMini");
    const profileDropdown =
        document.getElementById("profileDropdown");

    if (profileMini && profileDropdown) {
        profileMini.addEventListener("click", function (event) {
            event.stopPropagation();
            profileDropdown.classList.toggle("show");
        });

        document.addEventListener("click", function () {
            profileDropdown.classList.remove("show");
        });
    }


    /* =========================================
       LOGOUT
    ========================================= */

    function logout() {
        if (
            window.CVBuilderAuth &&
            typeof CVBuilderAuth.logout === "function"
        ) {
            CVBuilderAuth.logout();
        } else {
            localStorage.removeItem("cvbuilder_user");
            window.location.href = "login.html";
        }
    }

    const logoutBtn = document.getElementById("logoutBtn");
    const dropdownLogout =
        document.getElementById("dropdownLogout");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    if (dropdownLogout) {
        dropdownLogout.addEventListener("click", logout);
    }


    /* =========================================
       MOBILE SIDEBAR
    ========================================= */

    const mobileMenu = document.getElementById("mobileMenu");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

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


    /* =========================================
       CURRENT YEAR
    ========================================= */

    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

})();