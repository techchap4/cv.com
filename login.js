"use strict";

/* ==========================================================
   CONFIG
   ========================================================== */
const API_URL = "https://script.google.com/macros/s/AKfycbxvLXs4q3VImjB4ie6VVfitV0FSH2b--tDffS05ePnvqMESXiJo8h6mby4ECSjI3MRwGQ/exec";   // Apps Script "Web app" URL (ends with /exec)
const DASHBOARD_URL = "dashboard.html";          // where to go after a successful login
const RESEND_COOLDOWN_SEC = 60;
const MIN_PASSWORD_LENGTH = 8;

const SECTION_IDS = [
    "loginSection",
    "signupSection",
    "signupVerifySection",
    "forgotSection",
    "resetOTPSection",
    "newPasswordSection"
];

// Holds data between steps
const state = {
    signupEmail: "",
    resetEmail: "",
    resetToken: ""
};

const $ = (id) => document.getElementById(id);


/* ==========================================================
   UI HELPERS
   ========================================================== */
function showSection(id) {
    SECTION_IDS.forEach((s) => $(s).classList.toggle("active", s === id));
    document.querySelectorAll(".login-status").forEach((el) => {
        el.textContent = "";
        el.className = "login-status";
    });
}

function setStatus(id, message, type) {
    const el = $(id);
    el.textContent = message || "";
    el.className = "login-status" + (type ? " " + type : "");
}

async function withLoading(form, loadingText, task) {
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = loadingText;
    try {
        await task();
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
}

function startCooldown(btn, seconds = RESEND_COOLDOWN_SEC) {
    if (!btn.dataset.label) btn.dataset.label = btn.textContent.trim();
    const label = btn.dataset.label;
    clearInterval(btn._timer);

    let left = seconds;
    btn.disabled = true;
    btn.textContent = `${label} (${left}s)`;

    btn._timer = setInterval(() => {
        left--;
        if (left <= 0) {
            clearInterval(btn._timer);
            btn.disabled = false;
            btn.textContent = label;
        } else {
            btn.textContent = `${label} (${left}s)`;
        }
    }, 1000);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidOtp(otp) {
    return /^\d{6}$/.test(otp);
}


/* ==========================================================
   API
   Content-Type text/plain avoids the CORS preflight that
   Apps Script web apps cannot answer.
   ========================================================== */
async function api(action, payload = {}) {
    if (API_URL.startsWith("PASTE_")) {
        return { success: false, message: "API_URL is not set in login.js." };
    }
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action, ...payload })
        });
        return await res.json();
    } catch (err) {
        console.error(err);
        return { success: false, message: "Network error. Please check your connection and try again." };
    }
}


/* ==========================================================
   NAVIGATION (called from inline onclick in the HTML)
   ========================================================== */
function showLogin() {
    showSection("loginSection");
}

function showSignup() {
    showSection("signupSection");
}

function showForgot() {
    showSection("forgotSection");
    $("forgotEmail").value = $("loginEmail").value.trim();
}

function togglePassword(inputId, btn) {
    const input = $(inputId);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.querySelector(".material-icons").textContent = show ? "visibility_off" : "visibility";
}

function googleLogin() {
    alert("Google sign-in isn't set up yet.");
}

$("forgotPasswordLink").addEventListener("click", (e) => {
    e.preventDefault();
    showForgot();
});


/* ==========================================================
   LOGIN
   ========================================================== */
$("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

    if (!isValidEmail(email)) {
        return setStatus("loginStatus", "Please enter a valid email address.", "error");
    }

    withLoading(e.target, "Logging in...", async () => {
        setStatus("loginStatus", "");
        const res = await api("login", { email, password });

        if (!res.success) {
            return setStatus("loginStatus", res.message || "Login failed.", "error");
        }

        const storage = $("rememberMe").checked ? localStorage : sessionStorage;
        storage.setItem("greenauth_user", JSON.stringify(res.user));

        setStatus("loginStatus", "Login successful. Redirecting...", "success");
        setTimeout(() => { window.location.href = DASHBOARD_URL; }, 800);
    });
});


/* ==========================================================
   SIGNUP  ->  OTP VERIFICATION
   ========================================================== */
$("signupForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const name = $("signupName").value.trim();
    const email = $("signupEmail").value.trim();
    const password = $("signupPassword").value;
    const confirm = $("confirmPassword").value;

    if (name.length < 2) {
        return setStatus("signupStatus", "Please enter your full name.", "error");
    }
    if (!isValidEmail(email)) {
        return setStatus("signupStatus", "Please enter a valid email address.", "error");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return setStatus("signupStatus", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, "error");
    }
    if (password !== confirm) {
        return setStatus("signupStatus", "Passwords do not match.", "error");
    }

    withLoading(e.target, "Sending code...", async () => {
        setStatus("signupStatus", "");
        const res = await api("signup", { name, email, password });

        if (!res.success) {
            return setStatus("signupStatus", res.message || "Signup failed.", "error");
        }

        state.signupEmail = email.toLowerCase();
        $("signupEmailDisplay").textContent = state.signupEmail;
        $("signupOTP").value = "";

        showSection("signupVerifySection");
        setStatus("signupVerifyStatus", "Code sent. It expires in 10 minutes.", "success");
        startCooldown($("resendSignupOTP"));
        $("signupOTP").focus();
    });
});

$("signupVerifyForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const otp = $("signupOTP").value.trim();
    if (!isValidOtp(otp)) {
        return setStatus("signupVerifyStatus", "Enter the 6-digit code.", "error");
    }

    withLoading(e.target, "Verifying...", async () => {
        setStatus("signupVerifyStatus", "");
        const res = await api("verifySignup", { email: state.signupEmail, otp });

        if (!res.success) {
            return setStatus("signupVerifyStatus", res.message || "Verification failed.", "error");
        }

        // Clean up and send them to login
        $("signupForm").reset();
        $("signupVerifyForm").reset();

        showSection("loginSection");
        $("loginEmail").value = state.signupEmail;
        setStatus("loginStatus", "Email verified! Your account is ready. Please log in.", "success");
        state.signupEmail = "";
    });
});

$("resendSignupOTP").addEventListener("click", async () => {
    const btn = $("resendSignupOTP");
    btn.disabled = true;
    setStatus("signupVerifyStatus", "Sending a new code...");

    const res = await api("resendSignupOTP", { email: state.signupEmail });

    if (res.success) {
        setStatus("signupVerifyStatus", "A new code has been sent.", "success");
        startCooldown(btn);
    } else {
        setStatus("signupVerifyStatus", res.message || "Could not resend the code.", "error");
        btn.disabled = false;
    }
});


/* ==========================================================
   FORGOT PASSWORD  ->  RESET OTP  ->  NEW PASSWORD
   ========================================================== */
$("forgotForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = $("forgotEmail").value.trim();
    if (!isValidEmail(email)) {
        return setStatus("forgotStatus", "Please enter a valid email address.", "error");
    }

    withLoading(e.target, "Sending code...", async () => {
        setStatus("forgotStatus", "");
        const res = await api("forgotPassword", { email });

        if (!res.success) {
            return setStatus("forgotStatus", res.message || "Could not send the reset code.", "error");
        }

        // The server answers the same way whether or not the account exists
        state.resetEmail = email.toLowerCase();
        $("resetEmailDisplay").textContent = state.resetEmail;
        $("resetOTP").value = "";

        showSection("resetOTPSection");
        setStatus("resetOTPStatus", "If an account exists for that email, a code is on its way.", "success");
        startCooldown($("resendResetOTP"));
        $("resetOTP").focus();
    });
});

$("resetOTPForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const otp = $("resetOTP").value.trim();
    if (!isValidOtp(otp)) {
        return setStatus("resetOTPStatus", "Enter the 6-digit code.", "error");
    }

    withLoading(e.target, "Verifying...", async () => {
        setStatus("resetOTPStatus", "");
        const res = await api("verifyResetOTP", { email: state.resetEmail, otp });

        if (!res.success) {
            return setStatus("resetOTPStatus", res.message || "Verification failed.", "error");
        }

        state.resetToken = res.resetToken;
        $("newPasswordForm").reset();
        showSection("newPasswordSection");
    });
});

$("resendResetOTP").addEventListener("click", async () => {
    const btn = $("resendResetOTP");
    btn.disabled = true;
    setStatus("resetOTPStatus", "Sending a new code...");

    const res = await api("forgotPassword", { email: state.resetEmail });

    if (res.success) {
        setStatus("resetOTPStatus", "If an account exists for that email, a new code is on its way.", "success");
        startCooldown(btn);
    } else {
        setStatus("resetOTPStatus", res.message || "Could not resend the code.", "error");
        btn.disabled = false;
    }
});

$("newPasswordForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const newPassword = $("newPassword").value;
    const confirm = $("confirmNewPassword").value;

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return setStatus("newPasswordStatus", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, "error");
    }
    if (newPassword !== confirm) {
        return setStatus("newPasswordStatus", "Passwords do not match.", "error");
    }

    withLoading(e.target, "Saving...", async () => {
        setStatus("newPasswordStatus", "");
        const res = await api("resetPassword", {
            email: state.resetEmail,
            resetToken: state.resetToken,
            newPassword
        });

        if (!res.success) {
            return setStatus("newPasswordStatus", res.message || "Could not change the password.", "error");
        }

        const email = state.resetEmail;
        state.resetEmail = "";
        state.resetToken = "";
        $("newPasswordForm").reset();

        showSection("loginSection");
        $("loginEmail").value = email;
        setStatus("loginStatus", "Password changed successfully. Please log in.", "success");
    });
});