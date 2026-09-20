/* ============================================================
   CV BUILDER — DASHBOARD.JS
   Frontend logic for dashboard.html.
   Talks to a Google Apps Script Web App backend (code.gs)
   deployed as an API. Update APPS_SCRIPT_URL below once you
   deploy the script and copy the /exec URL.
============================================================ */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvLXs4q3VImjB4ie6VVfitV0FSH2b--tDffS05ePnvqMESXiJo8h6mby4ECSjI3MRwGQ/exec";

/* ------------------------------------------------------------
   Small helper: call the backend.
   Apps Script Web Apps don't support custom headers on
   preflighted requests, so we POST with a text/plain body
   (avoids a CORS preflight) and always stringify our own
   payload/parse the response ourselves.
------------------------------------------------------------ */
async function callBackend(action, payload = {}) {
    const body = JSON.stringify({ action, ...payload });

    const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body
    });

    if (!response.ok) {
        throw new Error("Network error: " + response.status);
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data.data;
}


/* ------------------------------------------------------------
   Auth guard — every dashboard page needs a logged-in user.
------------------------------------------------------------ */
function getLoggedInUser() {
    try {
        return JSON.parse(localStorage.getItem("loggedInUser"));
    } catch (err) {
        return null;
    }
}

function requireLogin() {
    const user = getLoggedInUser();

    if (!user || !user.user_id) {
        window.location.href = "login.html";
        return null;
    }

    return user;
}


/* ------------------------------------------------------------
   DOM references
------------------------------------------------------------ */
const els = {
    // Sidebar / mobile
    menuButton: document.getElementById("menuButton"),
    closeSidebar: document.getElementById("closeSidebar"),
    sidebar: document.getElementById("sidebar"),
    mobileOverlay: document.getElementById("mobileOverlay"),

    // Profile dropdown
    profileButton: document.querySelector(".profile-button"),
    profileDropdown: document.getElementById("profileDropdown"),
    userAvatar: document.getElementById("userAvatar"),
    topUserName: document.getElementById("topUserName"),
    welcomeName: document.getElementById("welcomeName"),

    // Search
    searchInput: document.getElementById("searchCV"),

    // Stats
    totalCVs: document.getElementById("totalCVs"),
    draftCVs: document.getElementById("draftCVs"),
    downloadCount: document.getElementById("downloadCount"),
    lastUpdated: document.getElementById("lastUpdated"),

    // CV grid / empty state
    cvGrid: document.getElementById("cvGrid"),
    emptyState: document.getElementById("emptyState"),

    // Activity
    activityCard: document.querySelector(".activity-card"),

    // Delete modal
    deleteModal: document.getElementById("deleteModal"),
    cancelDelete: document.getElementById("cancelDelete"),
    confirmDelete: document.getElementById("confirmDelete"),

    // Logout
    logoutButton: document.getElementById("logoutButton"),
    dropdownLogout: document.getElementById("dropdownLogout"),

    // Footer
    currentYear: document.getElementById("currentYear")
};

let allCVs = [];
let selectedCVId = null;


/* ------------------------------------------------------------
   Init
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", init);

async function init() {
    els.currentYear.textContent = new Date().getFullYear();

    const user = requireLogin();
    if (!user) return;

    renderUserChrome(user);
    bindStaticEvents();

    await Promise.all([
        loadCVs(user.user_id),
        loadActivity(user.user_id)
    ]);
}


/* ------------------------------------------------------------
   User chrome (avatar, name, welcome message)
------------------------------------------------------------ */
function renderUserChrome(user) {
    const name = user.full_name || user.name || "User";

    els.welcomeName.textContent = "Welcome back, " + name + "!";
    els.topUserName.textContent = name;
    els.userAvatar.textContent = name.charAt(0).toUpperCase();
}


/* ------------------------------------------------------------
   Static UI events (sidebar, dropdown, search, modal, logout)
------------------------------------------------------------ */
function bindStaticEvents() {

    // Mobile sidebar
    els.menuButton.addEventListener("click", () => {
        els.sidebar.classList.add("show");
        els.mobileOverlay.classList.add("show");
    });

    els.closeSidebar.addEventListener("click", closeMobileSidebar);
    els.mobileOverlay.addEventListener("click", closeMobileSidebar);

    function closeMobileSidebar() {
        els.sidebar.classList.remove("show");
        els.mobileOverlay.classList.remove("show");
    }

    // Profile dropdown
    els.profileButton.addEventListener("click", (event) => {
        event.stopPropagation();
        els.profileDropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
        els.profileDropdown.classList.remove("show");
    });

    // Search (client-side filter over already-loaded CVs)
    els.searchInput.addEventListener("input", function () {
        const term = this.value.toLowerCase().trim();
        filterCVCards(term);
    });

    // Delete modal
    els.cancelDelete.addEventListener("click", () => {
        closeDeleteModal();
    });

    els.confirmDelete.addEventListener("click", handleConfirmDelete);

    // Logout
    els.logoutButton.addEventListener("click", logoutUser);
    els.dropdownLogout.addEventListener("click", logoutUser);
}

function closeDeleteModal() {
    els.deleteModal.classList.remove("show");
    selectedCVId = null;
}

function logoutUser() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}


/* ------------------------------------------------------------
   Load + render CVs
------------------------------------------------------------ */
async function loadCVs(userId) {
    try {
        const cvs = await callBackend("getUserCVs", { user_id: userId });
        allCVs = Array.isArray(cvs) ? cvs : [];
        renderStats(allCVs);
        renderCVGrid(allCVs);
    } catch (err) {
        console.error("Failed to load CVs:", err);
        renderCVGrid([]); // fall back to empty state rather than a broken page
    }
}

function renderStats(cvs) {
    const drafts = cvs.filter((cv) => cv.status === "draft").length;
    const totalDownloads = cvs.reduce(
        (sum, cv) => sum + (Number(cv.download_count) || 0),
        0
    );

    const mostRecent = cvs
        .map((cv) => cv.updated_at)
        .filter(Boolean)
        .sort()
        .pop();

    els.totalCVs.textContent = cvs.length;
    els.draftCVs.textContent = drafts;
    els.downloadCount.textContent = totalDownloads;
    els.lastUpdated.textContent = mostRecent
        ? formatRelativeDate(mostRecent)
        : "—";
}

function renderCVGrid(cvs) {
    // Remove any previously rendered CV cards (keep the "create new" card)
    els.cvGrid
        .querySelectorAll(".cv-card")
        .forEach((card) => card.remove());

    if (cvs.length === 0) {
        els.emptyState.style.display = "";
        return;
    }

    els.emptyState.style.display = "none";

    cvs.forEach((cv) => {
        els.cvGrid.appendChild(buildCVCard(cv));
    });
}

function buildCVCard(cv) {
    const article = document.createElement("article");
    article.className = "cv-card";
    article.dataset.cvTitle = cv.title || "Untitled CV";
    article.dataset.cvId = cv.cv_id;

    const initial = (cv.full_name || cv.title || "?").charAt(0).toUpperCase();

    article.innerHTML = `
        <div class="cv-preview">
            <div class="preview-header">
                <div class="preview-avatar">${escapeHTML(initial)}</div>
                <div>
                    <div class="preview-name">${escapeHTML(
                        (cv.full_name || "").toUpperCase()
                    )}</div>
                    <div class="preview-title">${escapeHTML(
                        cv.job_title || ""
                    )}</div>
                </div>
            </div>
            <div class="preview-line"></div>
            <div class="preview-section">
                <span></span><span></span><span></span>
            </div>
            <div class="preview-section small">
                <span></span><span></span>
            </div>
            <div class="preview-section">
                <span></span><span></span><span></span>
            </div>
        </div>

        <div class="cv-card-content">
            <div class="cv-title-row">
                <div>
                    <h3>${escapeHTML(cv.title || "Untitled CV")}</h3>
                    <p>${escapeHTML(cv.template_name || "Custom template")}</p>
                </div>
                <button class="more-button" aria-label="More options">
                    <span class="material-icons">more_vert</span>
                </button>
            </div>

            <div class="cv-card-footer">
                <span class="updated-date">
                    <span class="material-icons">schedule</span>
                    ${escapeHTML(formatRelativeDate(cv.updated_at))}
                </span>

                <div class="cv-actions">
                    <a href="editor.html?id=${encodeURIComponent(
                        cv.cv_id
                    )}" class="edit-button">
                        <span class="material-icons">edit</span>
                        Edit
                    </a>

                    <button class="delete-button" data-cv-id="${escapeHTML(
                        cv.cv_id
                    )}" title="Delete CV">
                        <span class="material-icons">delete_outline</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    article
        .querySelector(".delete-button")
        .addEventListener("click", function () {
            selectedCVId = this.dataset.cvId;
            els.deleteModal.classList.add("show");
        });

    return article;
}

function filterCVCards(term) {
    document.querySelectorAll(".cv-card").forEach((card) => {
        const title = (card.dataset.cvTitle || "").toLowerCase();
        card.style.display = title.includes(term) ? "" : "none";
    });
}


/* ------------------------------------------------------------
   Delete CV
------------------------------------------------------------ */
async function handleConfirmDelete() {
    if (!selectedCVId) return;

    const user = getLoggedInUser();
    const idToDelete = selectedCVId;

    els.confirmDelete.disabled = true;
    els.confirmDelete.textContent = "Deleting…";

    try {
        await callBackend("deleteCV", {
            user_id: user.user_id,
            cv_id: idToDelete
        });

        allCVs = allCVs.filter((cv) => cv.cv_id !== idToDelete);
        renderStats(allCVs);
        renderCVGrid(allCVs);
    } catch (err) {
        console.error("Failed to delete CV:", err);
        alert("Couldn't delete that CV. Please try again.");
    } finally {
        els.confirmDelete.disabled = false;
        els.confirmDelete.textContent = "Delete CV";
        closeDeleteModal();
    }
}


/* ------------------------------------------------------------
   Recent activity
------------------------------------------------------------ */
async function loadActivity(userId) {
    try {
        const activity = await callBackend("getRecentActivity", {
            user_id: userId,
            limit: 5
        });

        renderActivity(Array.isArray(activity) ? activity : []);
    } catch (err) {
        console.error("Failed to load activity:", err);
    }
}

const ACTIVITY_ICONS = {
    edit: { icon: "edit", color: "green", label: "CV edited" },
    create: { icon: "add_circle", color: "blue", label: "CV created" },
    login: { icon: "login", color: "purple", label: "Account login" },
    download: { icon: "download", color: "orange", label: "CV downloaded" },
    delete: { icon: "delete_outline", color: "orange", label: "CV deleted" }
};

function renderActivity(items) {
    if (items.length === 0) return; // keep the static placeholder markup

    els.activityCard.innerHTML = "";

    items.forEach((item) => {
        const meta = ACTIVITY_ICONS[item.type] || {
            icon: "info",
            color: "blue",
            label: item.type
        };

        const row = document.createElement("div");
        row.className = "activity-item";
        row.innerHTML = `
            <div class="activity-icon ${meta.color}">
                <span class="material-icons">${meta.icon}</span>
            </div>
            <div class="activity-text">
                <strong>${escapeHTML(meta.label)}</strong>
                <p>${escapeHTML(item.description || "")}</p>
            </div>
            <span class="activity-time">${escapeHTML(
                formatRelativeDate(item.created_at)
            )}</span>
        `;

        els.activityCard.appendChild(row);
    });
}


/* ------------------------------------------------------------
   Utilities
------------------------------------------------------------ */
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatRelativeDate(isoString) {
    if (!isoString) return "—";

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "—";

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return diffMins + "m ago";
    if (diffHours < 24) return diffHours + "h ago";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return diffDays + "d ago";

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}