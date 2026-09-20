// ============================================================
// CV BUILDER LOGIN / SIGNUP / OTP VERIFICATION / PASSWORD RESET
// File: login.js
// ============================================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbyq9f0fHikEOluURFS5hH7XT2F1H1dj6H-a67Rp1dW6Mv3B3FA2wkNfodP664MOcjsLfw/exec";

const MIN_PASSWORD_LENGTH = 8;   // matches minlength in index.html
const RESEND_COOLDOWN_SECONDS = 30;

// State carried between screens
let pendingSignupEmail = "";
let pendingResetEmail = "";
let pendingResetOTP = "";        // code already checked, re-sent with the new password


// ============================================================
// HELPERS
// ============================================================

/** POST a JSON action to the Apps Script backend and return parsed JSON. */
async function callApi(payload) {
    const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    });
    return await response.json();
}

/** Show one screen and hide the others. */
function showSection(sectionId) {
    document.querySelectorAll(".form-section").forEach(function (section) {
        section.classList.remove("active");
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".login-status").forEach(function (el) {
        el.textContent = "";
    });
}

/** Write a message into a status <p>. type: "error" | "success" | "" */
function setStatus(id, message, type) {
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent = message || "";
    el.style.color =
        type === "error" ? "#d93025" :
        type === "success" ? "#188038" : "";
}

/** Disable a button and swap its text while a request is running. */
function setBusy(button, busy, busyText, normalText) {
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
}

/** Keep OTP inputs to digits only. */
function restrictToDigits(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("input", function () {
        input.value = input.value.replace(/\D/g, "").slice(0, 6);
    });
}

/** Cooldown so users can't spam the resend button. */
function startResendCooldown(button, label) {
    if (!button) return;

    let remaining = RESEND_COOLDOWN_SECONDS;
    button.disabled = true;
    button.textContent = label + " (" + remaining + "s)";

    const timer = setInterval(function () {
        remaining--;
        if (remaining <= 0) {
            clearInterval(timer);
            button.disabled = false;
            button.textContent = label;
        } else {
            button.textContent = label + " (" + remaining + "s)";
        }
    }, 1000);
}

const NETWORK_ERROR =
    "Unable to connect to the server. Please check your internet connection.";


// ============================================================
// SCREEN SWITCHING
// ============================================================

function showSignup() {
    showSection("signupSection");
}

function showLogin() {
    showSection("loginSection");
}

function showForgot() {
    const loginEmail = document.getElementById("loginEmail");
    const forgotEmail = document.getElementById("forgotEmail");
    if (loginEmail && forgotEmail && loginEmail.value && !forgotEmail.value) {
        forgotEmail.value = loginEmail.value;
    }
    showSection("forgotSection");
}


// ============================================================
// PASSWORD VISIBILITY
// ============================================================

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const icon = button.querySelector(".material-icons");
    const showing = input.type === "text";

    input.type = showing ? "password" : "text";
    if (icon) {
        icon.textContent = showing ? "visibility" : "visibility_off";
    }
}


// ============================================================
// SAVE USER SESSION
// ============================================================

function saveLoggedInUser(user) {
    if (!user || typeof user !== "object") {
        throw new Error("No valid user information was returned by the server.");
    }

    const name =
        user.full_name || user.name || user.fullName ||
        user.displayName || user.username || "";

    if (name) {
        user.full_name = name;
        user.name = name;
        user.fullName = name;
    }

    if (user.email_address && !user.email) {
        user.email = user.email_address;
    }

    if (user.professional_title && !user.job_title) {
        user.job_title = user.professional_title;
    }

    const data = JSON.stringify(user);

    localStorage.setItem("greenAuthUser", data);
    localStorage.setItem("loggedInUser", data);
    localStorage.setItem("cvbuilder_user", data);
    localStorage.setItem("cvbuilder_login_time", Date.now().toString());

    return user;
}


// ============================================================
// LOGIN
// ============================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const button = this.querySelector(".primary-btn");

        if (!email || !password) {
            setStatus("loginStatus", "Please enter your email and password.", "error");
            return;
        }

        setBusy(button, true, "Logging in...", "Log in");
        setStatus("loginStatus", "");

        try {
            const result = await callApi({
                action: "login",
                email: email,
                password: password
            });

            if (result.success) {
                saveLoggedInUser(result.user);
                window.location.href = "dashboard.html";
                return;
            }

            // Account exists but the email was never verified:
            // send a fresh code and move the user to the OTP screen.
            if (result.needsVerification) {
                pendingSignupEmail = email;
                document.getElementById("signupEmailDisplay").textContent = email;

                try {
                    await callApi({ action: "resendSignupOTP", email: email });
                } catch (e) {
                    console.warn("Could not resend verification code:", e);
                }

                showSection("signupVerifySection");
                setStatus(
                    "signupVerifyStatus",
                    "Your email isn't verified yet. We sent you a new code.",
                    "success"
                );
                startResendCooldown(
                    document.getElementById("resendSignupOTP"),
                    "Resend verification code"
                );
                return;
            }

            setStatus("loginStatus", result.message || "Invalid email or password.", "error");

        } catch (error) {
            console.error("Login error:", error);
            setStatus("loginStatus", NETWORK_ERROR, "error");
        } finally {
            setBusy(button, false, "", "Log in");
        }
    });
}


// ============================================================
// FORGOT PASSWORD LINK
// ============================================================

const forgotPasswordLink = document.getElementById("forgotPasswordLink");

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (event) {
        event.preventDefault();
        showForgot();
    });
}


// ============================================================
// SIGNUP  (step 1: create pending account + email OTP)
// ============================================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const button = this.querySelector(".primary-btn");

        if (!name || !email || !password) {
            setStatus("signupStatus", "Please complete all required fields.", "error");
            return;
        }

        if (password !== confirmPassword) {
            setStatus("signupStatus", "Passwords do not match.", "error");
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            setStatus(
                "signupStatus",
                "Password must be at least " + MIN_PASSWORD_LENGTH + " characters long.",
                "error"
            );
            return;
        }

        setBusy(button, true, "Creating account...", "Create account");
        setStatus("signupStatus", "");

        try {
            const result = await callApi({
                action: "signup",
                name: name,
                email: email,
                password: password
            });

            if (result.success) {
                pendingSignupEmail = email;
                document.getElementById("signupEmailDisplay").textContent = email;

                signupForm.reset();
                showSection("signupVerifySection");
                document.getElementById("signupOTP").value = "";
                document.getElementById("signupOTP").focus();

                startResendCooldown(
                    document.getElementById("resendSignupOTP"),
                    "Resend verification code"
                );
            } else {
                setStatus("signupStatus", result.message || "Unable to create account.", "error");
            }

        } catch (error) {
            console.error("Signup error:", error);
            setStatus("signupStatus", NETWORK_ERROR, "error");
        } finally {
            setBusy(button, false, "", "Create account");
        }
    });
}


// ============================================================
// SIGNUP  (step 2: verify email OTP)
// ============================================================

const signupVerifyForm = document.getElementById("signupVerifyForm");

if (signupVerifyForm) {
    signupVerifyForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const otp = document.getElementById("signupOTP").value.trim();
        const button = this.querySelector(".primary-btn");

        if (!/^\d{6}$/.test(otp)) {
            setStatus("signupVerifyStatus", "Please enter the 6-digit code.", "error");
            return;
        }

        if (!pendingSignupEmail) {
            setStatus("signupVerifyStatus", "Session expired. Please sign up again.", "error");
            return;
        }

        setBusy(button, true, "Verifying...", "Verify email");
        setStatus("signupVerifyStatus", "");

        try {
            const result = await callApi({
                action: "verifySignupOTP",
                email: pendingSignupEmail,
                otp: otp
            });

            if (result.success) {
                const verifiedEmail = pendingSignupEmail;
                pendingSignupEmail = "";

                showLogin();
                document.getElementById("loginEmail").value = verifiedEmail;
                document.getElementById("loginPassword").focus();
                setStatus(
                    "loginStatus",
                    "Email verified! You can now log in.",
                    "success"
                );
            } else {
                setStatus(
                    "signupVerifyStatus",
                    result.message || "Invalid or expired code.",
                    "error"
                );
            }

        } catch (error) {
            console.error("Verify signup OTP error:", error);
            setStatus("signupVerifyStatus", NETWORK_ERROR, "error");
        } finally {
            setBusy(button, false, "", "Verify email");
        }
    });
}

const resendSignupBtn = document.getElementById("resendSignupOTP");

if (resendSignupBtn) {
    resendSignupBtn.addEventListener("click", async function () {
        if (!pendingSignupEmail) {
            setStatus("signupVerifyStatus", "Session expired. Please sign up again.", "error");
            return;
        }

        const label = "Resend verification code";
        setBusy(resendSignupBtn, true, "Sending...", label);
        setStatus("signupVerifyStatus", "");

        try {
            const result = await callApi({
                action: "resendSignupOTP",
                email: pendingSignupEmail
            });

            if (result.success) {
                setStatus("signupVerifyStatus", "A new code has been sent.", "success");
                startResendCooldown(resendSignupBtn, label);
            } else {
                setStatus(
                    "signupVerifyStatus",
                    result.message || "Unable to resend code.",
                    "error"
                );
                setBusy(resendSignupBtn, false, "", label);
            }

        } catch (error) {
            console.error("Resend signup OTP error:", error);
            setStatus("signupVerifyStatus", NETWORK_ERROR, "error");
            setBusy(resendSignupBtn, false, "", label);
        }
    });
}


// ============================================================
// FORGOT PASSWORD  (step 1: request reset code)
// ============================================================

const forgotForm = document.getElementById("forgotForm");

if (forgotForm) {
    forgotForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("forgotEmail").value.trim();
        const button = this.querySelector(".primary-btn");

        if (!email) {
            setStatus("forgotStatus", "Please enter your email address.", "error");
            return;
        }

        setBusy(button, true, "Sending...", "Send reset code");
        setStatus("forgotStatus", "");

        try {
            const result = await callApi({
                action: "forgotPassword",
                email: email
            });

            if (result.success) {
                pendingResetEmail = email;
                pendingResetOTP = "";
                document.getElementById("resetEmailDisplay").textContent = email;

                showSection("resetOTPSection");
                document.getElementById("resetOTP").value = "";
                document.getElementById("resetOTP").focus();

                startResendCooldown(
                    document.getElementById("resendResetOTP"),
                    "Resend reset code"
                );
            } else {
                setStatus(
                    "forgotStatus",
                    result.message || "Unable to send reset code.",
                    "error"
                );
            }

        } catch (error) {
            console.error("Forgot password error:", error);
            setStatus("forgotStatus", NETWORK_ERROR, "error");
        } finally {
            setBusy(button, false, "", "Send reset code");
        }
    });
}


// ============================================================
// FORGOT PASSWORD  (step 2: verify reset code)
// ============================================================

const resetOTPForm = document.getElementById("resetOTPForm");

if (resetOTPForm) {
    resetOTPForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const otp = document.getElementById("resetOTP").value.trim();
        const button = this.querySelector(".primary-btn");

        if (!/^\d{6}$/.test(otp)) {
            setStatus("resetOTPStatus", "Please enter the 6-digit code.", "error");
            return;
        }

        if (!pendingResetEmail) {
            setStatus("resetOTPStatus", "Session expired. Please start again.", "error");
            return;
        }

        setBusy(button, true, "Verifying...", "Verify code");
        setStatus("resetOTPStatus", "");

        try {
            const result = await callApi({
                action: "verifyResetOTP",
                email: pendingResetEmail,
                otp: otp
            });

            if (result.success) {
                pendingResetOTP = otp;
                showSection("newPasswordSection");
                document.getElementById("newPassword").focus();
            } else {
                setStatus(
                    "resetOTPStatus",
                    result.message || "Invalid or expired code.",
                    "error"
                );
            }

        } catch (error) {
            console.error("Verify reset OTP error:", error);
            setStatus("resetOTPStatus", NETWORK_ERROR, "error");
        } finally {
            setBusy(button, false, "", "Verify code");
        }
    });
}

const resendResetBtn = document.getElementById("resendResetOTP");

if (resendResetBtn) {
    resendResetBtn.addEventListener("click", async function () {
        if (!pendingResetEmail) {
            setStatus("resetOTPStatus", "Session expired. Please start again.", "error");
            return;
        }

        const label = "Resend reset code";
        setBusy(resendResetBtn, true, "Sending...", label);
        setStatus("resetOTPStatus", "");

        try {
            const result = await callApi({
                action: "forgotPassword",
                email: pendingResetEmail
            });

            if (result.success) {
                setStatus("resetOTPStatus", "A new code has been sent.", "success");
                startResendCooldown(resendResetBtn, label);
            } else {
                setStatus(
                    "resetOTPStatus",
                    result.message || "Unable to resend code.",
                    "error"
                );
                setBusy(resendResetBtn, false, "", label);
            }

        } catch (error) {
            console.error("Resend reset OTP error:", error);
            setStatus("resetOTPStatus", NETWORK_ERROR, "error");
            setBusy(resendResetBtn, false, "", label);
        }
    });
}


// ============================================================
// FORGOT PASSWORD  (step 3: set new password)
// ============================================================

const newPasswordForm = document.getElementById("newPasswordForm");

if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;
        const button = this.querySelector(".primary-btn");

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setStatus(
                "newPasswordStatus",
                "Password must be at least " + MIN_PASSWORD_LENGTH + " characters long.",
                "error"
            );
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setStatus("newPasswordStatus", "Passwords do not match.", "error");
            return;
        }

        if (!pendingResetEmail || !pendingResetOTP) {
            setStatus("newPasswordStatus", "Session expired. Please start again.", "error");
            return;
        }

        setBusy(button, true, "Saving...", "Change password");
        setStatus("newPasswordStatus", "");

        try {
            // The OTP is sent again so the server re-checks it
            // before changing the password.
            const result = await callApi({
                action: "resetPassword",
                email: pendingResetEmail,
                otp: pendingResetOTP,
                newPassword: newPassword
            });

            if (result.success) {
                const email = pendingResetEmail;
                pendingResetEmail = "";
                pendingResetOTP = "";
                newPasswordForm.reset();

                showLogin();
                document.getElementById("loginEmail").value = email;
                document.getElementById("loginPassword").value = "";
                setStatus(
                    "loginStatus",
                    "Password changed successfully. Please log in.",
                    "success"
                );
            } else {
                setStatus(
                    "newPasswordStatus",
                    result.message || "Unable to change password.",
                    "error"
                );
            }

        } catch (error) {
            console.error("Reset password error:", error);
            setStatus("newPasswordStatus", NETWORK_ERROR, "error");
        } finally {
            setBusy(button, false, "", "Change password");
        }
    });
}


// ============================================================
// INPUT RESTRICTIONS FOR OTP FIELDS
// ============================================================

restrictToDigits("signupOTP");
restrictToDigits("resetOTP");


// ============================================================
// GOOGLE LOGIN
// ============================================================

function googleLogin() {
    alert(
        "Google login requires Google OAuth configuration. Your current system uses email and password authentication."
    );
}


// ============================================================
// GET CURRENT USER
// ============================================================

function getCurrentUser() {
    const keys = ["greenAuthUser", "loggedInUser", "cvbuilder_user"];

    for (let i = 0; i < keys.length; i++) {
        const value = localStorage.getItem(keys[i]);
        if (!value) continue;

        try {
            const user = JSON.parse(value);
            if (user && typeof user === "object") {
                return user;
            }
        } catch (error) {
            console.warn("Invalid stored user:", keys[i]);
        }
    }

    return null;
}


// ============================================================
// LOGOUT
// ============================================================

function logout() {
    localStorage.removeItem("greenAuthUser");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("cvbuilder_user");
    localStorage.removeItem("cvbuilder_login_time");

    window.location.href = "index.html";
}