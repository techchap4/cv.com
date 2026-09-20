/* ============================================================
   CV BUILDER - CENTRAL USER AUTHENTICATION SYSTEM
   File: auth.js

   PURPOSE:
   ------------------------------------------------------------
   This file is ONLY responsible for:

   1. Finding the currently logged-in user
   2. Keeping the user session available across all pages
   3. Displaying the user's information
   4. Updating the user's information
   5. Handling logout

   It does NOT control:
   - CV creation
   - CV templates
   - CV editor
   - CV saving
   - Dashboard statistics
   - Other website features

   Therefore the existing website system remains intact.
   ============================================================ */

(function () {

    "use strict";


    /* ============================================================
       1. STORAGE KEYS
    ============================================================ */

    const MAIN_KEY = "greenAuthUser";

    const OLD_KEY_1 = "loggedInUser";

    const OLD_KEY_2 = "cvbuilder_user";


    /* ============================================================
       2. LOGIN PAGE
    ============================================================ */

    /*
       All pages will use this page when the user is logged out.

       Change ONLY this value if your actual login page has
       another filename.
    */

    const LOGIN_PAGE = "index.html";


    /* ============================================================
       3. SAFELY READ JSON
    ============================================================ */

    function parseStorage(key) {

        try {

            const value =
                localStorage.getItem(key);

            if (!value) {
                return null;
            }

            const parsed =
                JSON.parse(value);

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                return parsed;

            }

        } catch (error) {

            console.error(
                "CVBuilder Auth: Could not read " + key,
                error
            );

        }

        return null;
    }


    /* ============================================================
       4. FIND USER
    ============================================================ */

    function getStoredUser() {

        /*
           IMPORTANT:

           Do NOT depend only on greenAuthUser.

           We check all three keys because your existing pages
           have historically used all three.
        */

        const mainUser =
            parseStorage(MAIN_KEY);

        const oldUser1 =
            parseStorage(OLD_KEY_1);

        const oldUser2 =
            parseStorage(OLD_KEY_2);


        /*
           If nothing exists, there is no logged-in user.
        */

        if (
            !mainUser &&
            !oldUser1 &&
            !oldUser2
        ) {

            return null;

        }


        /*
           Merge the available information.

           Newer information wins where it exists.
        */

        const user = Object.assign(
            {},
            oldUser1 || {},
            oldUser2 || {},
            mainUser || {}
        );


        /*
           Normalize the user's name.

           Your different pages have used:
           full_name
           name
           fullName
           username
           displayName
        */

        const resolvedName =
            user.full_name ||
            user.name ||
            user.fullName ||
            user.displayName ||
            user.username ||
            "";


        if (resolvedName) {

            user.full_name =
                resolvedName;

            user.name =
                resolvedName;

            user.fullName =
                resolvedName;

        }


        /*
           Normalize email.
        */

        const resolvedEmail =
            user.email ||
            user.email_address ||
            "";


        if (resolvedEmail) {

            user.email =
                resolvedEmail;

        }


        /*
           Normalize professional title.
        */

        const resolvedTitle =
            user.job_title ||
            user.professional_title ||
            user.title ||
            "";


        if (resolvedTitle) {

            user.job_title =
                resolvedTitle;

            user.professional_title =
                resolvedTitle;

        }


        return user;

    }


    /* ============================================================
       5. SAVE USER EVERYWHERE
    ============================================================ */

    function saveUser(user) {

        if (
            !user ||
            typeof user !== "object"
        ) {

            return;

        }


        try {

            /*
               Normalize name before saving.
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
               Normalize job title.
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
               MAIN SESSION
            */

            localStorage.setItem(
                MAIN_KEY,
                data
            );


            /*
               OLD DASHBOARD / SETTINGS SESSION
            */

            localStorage.setItem(
                OLD_KEY_1,
                data
            );


            /*
               OLD PROFILE / CREATE-CV SESSION
            */

            localStorage.setItem(
                OLD_KEY_2,
                data
            );


        } catch (error) {

            console.error(
                "CVBuilder Auth: Could not save user.",
                error
            );

        }

    }


    /* ============================================================
       6. USER NAME
    ============================================================ */

    function getUserName(user) {

        if (!user) {
            return "User";
        }


        return (
            user.full_name ||
            user.name ||
            user.fullName ||
            user.displayName ||
            user.username ||
            "User"
        ).trim();

    }


    /* ============================================================
       7. FIRST NAME
    ============================================================ */

    function getFirstName(name) {

        if (!name) {
            return "User";
        }


        return name
            .trim()
            .split(/\s+/)[0];

    }


    /* ============================================================
       8. INITIALS
    ============================================================ */

    function getInitials(name) {

        if (!name) {
            return "U";
        }


        const words =
            name
                .trim()
                .split(/\s+/);


        if (words.length === 1) {

            return words[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();

    }


    /* ============================================================
       9. UPDATE HTML ELEMENT
    ============================================================ */

    function setElement(id, value) {

        const element =
            document.getElementById(id);


        if (!element) {
            return;
        }


        if (
            value === undefined ||
            value === null
        ) {

            return;

        }


        /*
           INPUT / TEXTAREA / SELECT
        */

        if (
            element.tagName === "INPUT" ||
            element.tagName === "TEXTAREA" ||
            element.tagName === "SELECT"
        ) {

            element.value =
                value;

            return;

        }


        /*
           NORMAL HTML ELEMENT
        */

        element.textContent =
            value;

    }


    /* ============================================================
       10. UPDATE USER INFORMATION ON CURRENT PAGE
    ============================================================ */

    function displayUser() {

        const user =
            getStoredUser();


        /*
           Nothing to display.
        */

        if (!user) {

            return null;

        }


        /*
           Immediately synchronize all three
           storage locations.
        */

        saveUser(user);


        const name =
            getUserName(user);


        const firstName =
            getFirstName(name);


        const initials =
            getInitials(name);


        const email =
            user.email ||
            "";


        const phone =
            user.phone ||
            user.phone_number ||
            "";


        const location =
            user.location ||
            user.current_location ||
            user.address ||
            "";


        const jobTitle =
            user.job_title ||
            user.professional_title ||
            user.title ||
            "";


        /* ========================================================
           DASHBOARD
        ======================================================== */

        /*
           Dashboard HTML contains:

           <h1 id="welcomeName">
        */

        setElement(
            "welcomeName",
            "Welcome back, " + name + "!"
        );


        /*
           Dashboard top user name
        */

        setElement(
            "topUserName",
            name
        );


        /*
           Other possible navigation names
        */

        setElement(
            "topProfileName",
            name
        );


        setElement(
            "userName",
            name
        );


        /* ========================================================
           PROFILE
        ======================================================== */

        setElement(
            "displayProfileName",
            name
        );


        setElement(
            "displayProfileTitle",
            jobTitle
        );


        setElement(
            "displayLocation",
            location
        );


        /* ========================================================
           SETTINGS
        ======================================================== */

        setElement(
            "settingsName",
            name
        );


        setElement(
            "settingsEmail",
            email
        );


        setElement(
            "settingsJobTitle",
            jobTitle
        );


        /* ========================================================
           GENERAL USER FIELDS
        ======================================================== */

        setElement(
            "fullName",
            name
        );


        setElement(
            "email",
            email
        );


        setElement(
            "phone",
            phone
        );


        setElement(
            "location",
            location
        );


        setElement(
            "professionalTitle",
            jobTitle
        );


        setElement(
            "userFullName",
            name
        );


        setElement(
            "userEmail",
            email
        );


        setElement(
            "userPhone",
            phone
        );


        setElement(
            "userLocation",
            location
        );


        setElement(
            "userJobTitle",
            jobTitle
        );


        /* ========================================================
           AVATARS
        ======================================================== */

        const avatarIds = [

            "userAvatar",

            "topAvatar",

            "topProfileAvatar",

            "profileAvatar"

        ];


        avatarIds.forEach(
            function (id) {

                const avatar =
                    document.getElementById(id);


                if (!avatar) {
                    return;
                }


                /*
                   If it is an image
                */

                if (
                    avatar.tagName === "IMG"
                ) {

                    const photo =
                        user.profile_picture ||
                        user.profilePicture ||
                        user.avatar ||
                        user.photoURL ||
                        "";


                    if (photo) {

                        avatar.src =
                            photo;

                    }


                    avatar.alt =
                        name;

                }


                /*
                   If it is a DIV/SPAN
                */

                else {

                    avatar.textContent =
                        initials;

                }

            }
        );


        return user;

    }


    /* ============================================================
       11. UPDATE USER
    ============================================================ */

    function updateUser(changes) {

        if (
            !changes ||
            typeof changes !== "object"
        ) {

            return null;

        }


        const currentUser =
            getStoredUser() || {};


        /*
           Merge old and new information.
        */

        const updatedUser =
            Object.assign(
                {},
                currentUser,
                changes
            );


        /*
           Name synchronization
        */

        if (changes.name) {

            updatedUser.name =
                changes.name;

            updatedUser.full_name =
                changes.name;

            updatedUser.fullName =
                changes.name;

        }


        if (changes.full_name) {

            updatedUser.name =
                changes.full_name;

            updatedUser.full_name =
                changes.full_name;

            updatedUser.fullName =
                changes.full_name;

        }


        /*
           Job title synchronization
        */

        if (changes.job_title) {

            updatedUser.job_title =
                changes.job_title;

            updatedUser.professional_title =
                changes.job_title;

        }


        /*
           Save to all storage locations.
        */

        saveUser(updatedUser);


        /*
           Refresh visible information.
        */

        displayUser();


        /*
           Tell other browser tabs that the
           user information has changed.
        */

        try {

            localStorage.setItem(
                "cvbuilder_user_updated_at",
                Date.now().toString()
            );

        } catch (error) {

            console.warn(error);

        }


        return updatedUser;

    }


    /* ============================================================
       12. REQUIRE LOGIN
    ============================================================ */

    function requireLogin() {

        const user =
            getStoredUser();


        if (!user) {

            window.location.href =
                LOGIN_PAGE;

            return null;

        }


        /*
           Make sure every old page has the
           same user.
        */

        saveUser(user);


        return user;

    }


    /* ============================================================
       13. LOGOUT
    ============================================================ */

    function logout() {

        const confirmed =
            window.confirm(
                "Are you sure you want to log out?"
            );


        if (!confirmed) {

            return false;

        }


        /*
           Remove ALL three session copies.
        */

        localStorage.removeItem(
            MAIN_KEY
        );


        localStorage.removeItem(
            OLD_KEY_1
        );


        localStorage.removeItem(
            OLD_KEY_2
        );


        /*
           Keep CV data untouched.

           We are only logging the user out.
        */


        /*
           Go to the actual login page.
        */

        window.location.href =
            LOGIN_PAGE;


        return true;

    }


    /* ============================================================
       14. CONNECT LOGOUT BUTTONS
    ============================================================ */

    function connectLogoutButtons() {

        const selectors = [

            "#logoutButton",

            "#dropdownLogout",

            "#logoutBtn",

            "#sidebarLogout",

            ".logout-button",

            ".logout-btn",

            ".logout-button",

            "[data-action='logout']"

        ];


        const buttons =
            document.querySelectorAll(
                selectors.join(",")
            );


        buttons.forEach(
            function (button) {

                if (
                    button.dataset.authLogoutConnected ===
                    "true"
                ) {

                    return;

                }


                button.dataset.authLogoutConnected =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();

                        logout();

                    }
                );

            }
        );

    }


    /* ============================================================
       15. INITIALIZE
    ============================================================ */

    function initializeAuth() {

        /*
           Do NOT force login on the login page.

           Login page needs auth.js only for its helper
           functions, not as a login guard.
        */

        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        const loginPages = [

            "",

            "index.html",

            "login.html",

            "login-index.html"

        ];


        /*
           On normal website pages:
           load the current user.
        */

        if (
            !loginPages.includes(currentPage)
        ) {

            const user =
                requireLogin();


            if (user) {

                displayUser();

            }

        }


        /*
           Connect logout buttons wherever they exist.
        */

        connectLogoutButtons();

    }


    /* ============================================================
       16. PUBLIC FUNCTIONS
    ============================================================ */

    window.CVBuilderAuth = {

        getUser:
            getStoredUser,

        readUser:
            getStoredUser,

        saveUser:
            saveUser,

        updateUser:
            updateUser,

        displayUser:
            displayUser,

        fillUserInformation:
            displayUser,

        requireLogin:
            requireLogin,

        getUserName:
            getUserName,

        getFirstName:
            getFirstName,

        getInitials:
            getInitials,

        logout:
            logout

    };


    /* ============================================================
       17. RUN AUTH SYSTEM
    ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAuth
        );

    }

    else {

        initializeAuth();

    }


    /* ============================================================
       18. WATCH FOR CHANGES FROM OTHER TABS
    ============================================================ */

    window.addEventListener(
        "storage",
        function (event) {

            if (

                event.key === MAIN_KEY ||

                event.key === OLD_KEY_1 ||

                event.key === OLD_KEY_2 ||

                event.key ===
                "cvbuilder_user_updated_at"

            ) {

                displayUser();

            }

        }
    );


})();