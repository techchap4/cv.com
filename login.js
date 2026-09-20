// ============================================================
// CV BUILDER LOGIN / SIGNUP
// File: login.js
// ============================================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbzcjF69KosHqoQ0EOTQZbgPMWZGHcXCgdUL7Qr8YeCibFwgNHz19ob7p0yU1VT9rNAw/exec";


// ============================================================
// LOGIN / SIGNUP SWITCHING
// ============================================================

function showSignup() {

    const loginSection =
        document.getElementById("loginSection");

    const signupSection =
        document.getElementById("signupSection");


    if (loginSection) {

        loginSection.classList.remove("active");

    }


    if (signupSection) {

        signupSection.classList.add("active");

    }

}


function showLogin() {

    const loginSection =
        document.getElementById("loginSection");

    const signupSection =
        document.getElementById("signupSection");


    if (signupSection) {

        signupSection.classList.remove("active");

    }


    if (loginSection) {

        loginSection.classList.add("active");

    }

}


// ============================================================
// PASSWORD VISIBILITY
// ============================================================

function togglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);


    if (!input) {
        return;
    }


    if (
        input.type ===
        "password"
    ) {

        input.type =
            "text";


        const icon =
            button.querySelector(
                ".material-icons"
            );


        if (icon) {

            icon.textContent =
                "visibility_off";

        }

    }

    else {

        input.type =
            "password";


        const icon =
            button.querySelector(
                ".material-icons"
            );


        if (icon) {

            icon.textContent =
                "visibility";

        }

    }

}


// ============================================================
// SAVE USER SESSION
// ============================================================

function saveLoggedInUser(user) {

    if (
        !user ||
        typeof user !== "object"
    ) {

        throw new Error(
            "No valid user information was returned by the server."
        );

    }


    /*
       Normalize the user's name.

       This handles different possible response names
       from the Apps Script backend.
    */

    const name =
        user.full_name ||
        user.name ||
        user.fullName ||
        user.displayName ||
        user.username ||
        "";


    if (name) {

        user.full_name =
            name;

        user.name =
            name;

        user.fullName =
            name;

    }


    /*
       Normalize email.
    */

    if (
        user.email_address &&
        !user.email
    ) {

        user.email =
            user.email_address;

    }


    /*
       Normalize professional title.
    */

    if (
        user.professional_title &&
        !user.job_title
    ) {

        user.job_title =
            user.professional_title;

    }


    const data =
        JSON.stringify(user);


    /*
       SAVE TO ALL THREE KEYS.

       This is the critical part.
    */

    localStorage.setItem(
        "greenAuthUser",
        data
    );


    localStorage.setItem(
        "loggedInUser",
        data
    );


    localStorage.setItem(
        "cvbuilder_user",
        data
    );


    /*
       Record the time the session was created.
    */

    localStorage.setItem(
        "cvbuilder_login_time",
        Date.now().toString()
    );


    return user;

}


// ============================================================
// LOGIN
// ============================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            if (
                !email ||
                !password
            ) {

                alert(
                    "Please enter your email and password."
                );

                return;

            }


            const button =
                this.querySelector(
                    ".primary-btn"
                );


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Logging in...";

            }


            try {

                const response =
                    await fetch(
                        API_URL,
                        {
                            method: "POST",

                            body:
                                JSON.stringify({

                                    action:
                                        "login",

                                    email:
                                        email,

                                    password:
                                        password

                                })

                        }
                    );


                const result =
                    await response.json();


                if (
                    result.success
                ) {

                    /*
                       Store the complete user
                       in all three locations.
                    */

                    saveLoggedInUser(
                        result.user
                    );


                    alert(
                        "Login successful!"
                    );


                    /*
                       Go to dashboard.
                    */

                    window.location.href =
                        "dashboard.html";

                }

                else {

                    alert(
                        result.message ||
                        "Invalid email or password."
                    );

                }

            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                alert(
                    "Unable to connect to the server. Please check your internet connection."
                );

            }

            finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "Log in";

                }

            }

        }
    );

}


// ============================================================
// SIGNUP
// ============================================================

const signupForm =
    document.getElementById(
        "signupForm"
    );


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("signupName")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("signupEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("signupPassword")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            if (
                !name ||
                !email ||
                !password
            ) {

                alert(
                    "Please complete all required fields."
                );

                return;

            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;

            }


            if (
                password.length < 6
            ) {

                alert(
                    "Password must be at least 6 characters long."
                );

                return;

            }


            const button =
                this.querySelector(
                    ".primary-btn"
                );


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Creating account...";

            }


            try {

                const response =
                    await fetch(
                        API_URL,
                        {
                            method: "POST",

                            body:
                                JSON.stringify({

                                    action:
                                        "signup",

                                    name:
                                        name,

                                    email:
                                        email,

                                    password:
                                        password

                                })

                        }
                    );


                const result =
                    await response.json();


                if (
                    result.success
                ) {

                    alert(
                        "Account created successfully!"
                    );


                    signupForm.reset();


                    showLogin();


                    const loginEmail =
                        document.getElementById(
                            "loginEmail"
                        );


                    if (loginEmail) {

                        loginEmail.value =
                            email;

                    }

                }

                else {

                    alert(
                        result.message ||
                        "Unable to create account."
                    );

                }

            }

            catch (error) {

                console.error(
                    "Signup error:",
                    error
                );


                alert(
                    "Unable to connect to the server. Please check your internet connection."
                );

            }

            finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "Create account";

                }

            }

        }
    );

}


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

    const keys = [

        "greenAuthUser",

        "loggedInUser",

        "cvbuilder_user"

    ];


    for (
        let i = 0;
        i < keys.length;
        i++
    ) {

        const value =
            localStorage.getItem(
                keys[i]
            );


        if (!value) {
            continue;
        }


        try {

            const user =
                JSON.parse(value);


            if (
                user &&
                typeof user === "object"
            ) {

                return user;

            }

        }

        catch (error) {

            console.warn(
                "Invalid stored user:",
                keys[i]
            );

        }

    }


    return null;

}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    localStorage.removeItem(
        "greenAuthUser"
    );


    localStorage.removeItem(
        "loggedInUser"
    );


    localStorage.removeItem(
        "cvbuilder_user"
    );


    localStorage.removeItem(
        "cvbuilder_login_time"
    );


    window.location.href =
        "index.html";

}