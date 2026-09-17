// ======================================================
// APEX CRICKET ACADEMY — MAIN SCRIPT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // ==================================================
    // MOBILE MENU
    // ==================================================

    const mobileMenu = document.getElementById("mobileMenu");
    const navLinks = document.getElementById("navLinks");

    if (mobileMenu && navLinks) {

        mobileMenu.addEventListener("click", () => {

            navLinks.classList.toggle("open");
            navLinks.classList.toggle("active");

            const isOpen =
                navLinks.classList.contains("open");

            mobileMenu.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );
        });

        navLinks.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                navLinks.classList.remove("open");
                navLinks.classList.remove("active");

                mobileMenu.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });
    }


    // ==================================================
    // HEADER SCROLL EFFECT
    // ==================================================

    const header =
        document.querySelector(".header");

    if (header) {

        const handleScroll = () => {

            if (window.scrollY > 30) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }

        };

        handleScroll();

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        );
    }


    // ==================================================
    // LIGHTBOX
    // ==================================================

    const lightbox =
        document.getElementById("lightbox");

    const lightboxImage =
        document.getElementById("lightboxImage");

    const lightboxClose =
        document.getElementById("lightboxClose");


    function openLightbox(imageUrl) {

        if (
            !lightbox ||
            !lightboxImage ||
            !imageUrl
        ) {
            return;
        }

        lightboxImage.src = imageUrl;

        lightbox.classList.add("active");

        document.body.style.overflow = "hidden";
    }


    function closeLightbox() {

        if (!lightbox) {
            return;
        }

        lightbox.classList.remove("active");

        if (lightboxImage) {
            lightboxImage.src = "";
        }

        document.body.style.overflow = "";
    }


    if (lightboxClose) {

        lightboxClose.addEventListener(
            "click",
            closeLightbox
        );

    }


    if (lightbox) {

        lightbox.addEventListener(
            "click",
            event => {

                if (event.target === lightbox) {
                    closeLightbox();
                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                lightbox &&
                lightbox.classList.contains("active")
            ) {

                closeLightbox();

            }

        }
    );


    // ==================================================
    // NORMAL LOCAL GALLERY
    // ==================================================

    const galleryItems =
        document.querySelectorAll(
            ".gallery-item, .gallery-card, .album-item"
        );


    galleryItems.forEach(item => {

        if (
            item.dataset.lightboxReady === "true"
        ) {
            return;
        }

        item.dataset.lightboxReady = "true";


        item.addEventListener(
            "click",
            event => {

                /*
                 * Agar gallery item kisi page/link
                 * par jaana chahta hai, normal link
                 * behaviour allow karenge.
                 */

                const image =
                    item.dataset.image ||
                    item.querySelector("img")?.src;


                if (!image) {
                    return;
                }


                /*
                 * Gallery page ke image links ko
                 * bhi lightbox mein open karenge.
                 */

                if (
                    item.tagName.toLowerCase() === "a"
                ) {
                    event.preventDefault();
                }


                openLightbox(image);

            }
        );

    });


    // ==================================================
    // GALLERY FILTER
    // ==================================================

    const filterButtons =
        document.querySelectorAll(
            ".filter-btn"
        );


    const allGalleryItems =
        document.querySelectorAll(
            ".gallery-item"
        );


    function applyFilter(filter = "all") {

        allGalleryItems.forEach(item => {

            const category =
                item.dataset.category || "";


            if (
                filter === "all" ||
                category === filter
            ) {

                item.style.display = "";

            } else {

                item.style.display = "none";

            }

        });

    }


    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(btn => {

                    btn.classList.remove(
                        "active"
                    );

                });


                button.classList.add(
                    "active"
                );


                const filter =
                    button.dataset.filter ||
                    "all";


                applyFilter(filter);

            }
        );

    });


    const activeFilter =
        document.querySelector(
            ".filter-btn.active"
        );


    if (activeFilter) {

        applyFilter(
            activeFilter.dataset.filter ||
            "all"
        );

    }


    // ==================================================
    // ADMISSION FORM → GMAIL
    // ==================================================

    const admissionForm =
        document.getElementById(
            "admissionForm"
        );


    if (admissionForm) {

        admissionForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const submitButton =
                    admissionForm.querySelector(
                        'button[type="submit"], input[type="submit"]'
                    );


                // ------------------------------------------
                // GET FORM DATA
                // ------------------------------------------

                const playerName =
                    document.getElementById(
                        "playerName"
                    )?.value.trim();


                const age =
                    document.getElementById(
                        "playerAge"
                    )?.value.trim();


                const phone =
                    document.getElementById(
                        "phone"
                    )?.value.trim();


                const email =
                    document.getElementById(
                        "email"
                    )?.value.trim();


                const program =
                    document.getElementById(
                        "program"
                    )?.value;


                const message =
                    document.getElementById(
                        "message"
                    )?.value.trim();


                // ------------------------------------------
                // BASIC VALIDATION
                // ------------------------------------------

                if (
                    !playerName ||
                    !age ||
                    !phone ||
                    !email ||
                    !program
                ) {

                    showFormMessage(
                        "Please fill all required fields.",
                        "error"
                    );

                    return;
                }


                // ------------------------------------------
                // BUTTON LOADING
                // ------------------------------------------

                const originalButtonText =
                    submitButton
                        ? submitButton.innerHTML
                        : "";


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.innerHTML =
                        "Sending Application...";

                }


                // ------------------------------------------
                // SEND TO SERVER
                // ------------------------------------------

                try {

                    const response =
                        await fetch(
                            "/api/admission",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    playerName,
                                    age,
                                    phone,
                                    email,
                                    program,
                                    message

                                })
                            }
                        );


                    const data =
                        await response.json();


                    // --------------------------------------
                    // SUCCESS
                    // --------------------------------------

                    if (
                        response.ok &&
                        data.success
                    ) {

                        showFormMessage(
                            `Application submitted successfully! Application ID: ${data.applicationId}`,
                            "success"
                        );


                        admissionForm.reset();


                    } else {

                        showFormMessage(
                            data.message ||
                            "Failed to send application. Please try again.",
                            "error"
                        );

                    }


                } catch (error) {

                    console.error(
                        "Admission Error:",
                        error
                    );


                    showFormMessage(
                        "Unable to connect to the server. Please try again.",
                        "error"
                    );

                }


                // ------------------------------------------
                // RESTORE BUTTON
                // ------------------------------------------

                if (submitButton) {

                    submitButton.disabled = false;

                    submitButton.innerHTML =
                        originalButtonText;

                }

            }
        );

    }


    // ==================================================
    // FORM MESSAGE
    // ==================================================

    function showFormMessage(
        message,
        type
    ) {

        let messageBox =
            document.getElementById(
                "formMessage"
            );


        // Create message box if it doesn't exist
        if (!messageBox) {

            messageBox =
                document.createElement(
                    "div"
                );

            messageBox.id =
                "formMessage";

            messageBox.style.marginTop =
                "15px";

            messageBox.style.padding =
                "13px 15px";

            messageBox.style.fontSize =
                "12px";

            messageBox.style.lineHeight =
                "1.6";


            if (admissionForm) {

                admissionForm.appendChild(
                    messageBox
                );

            }

        }


        messageBox.textContent =
            message;


        if (type === "success") {

            messageBox.style.color =
                "#d8ff32";

            messageBox.style.background =
                "rgba(216,255,50,.07)";

            messageBox.style.border =
                "1px solid rgba(216,255,50,.25)";

        } else {

            messageBox.style.color =
                "#ff8b8b";

            messageBox.style.background =
                "rgba(255,70,70,.07)";

            messageBox.style.border =
                "1px solid rgba(255,70,70,.25)";

        }

    }


    // ==================================================
    // SMOOTH ANCHOR LINKS
    // ==================================================

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetId =
                    link.getAttribute("href");


                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }


                const target =
                    document.querySelector(
                        targetId
                    );


                if (!target) {
                    return;
                }


                event.preventDefault();


                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    });


    // ==================================================
    // IMAGE ERROR HANDLING
    // ==================================================

    document.querySelectorAll(
        "img"
    ).forEach(img => {

        img.addEventListener(
            "error",
            () => {

                img.classList.add(
                    "image-error"
                );

            }
        );

    });


    console.log(
        "🏏 Apex Cricket Academy website loaded successfully."
    );

});