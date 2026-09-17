"use strict";

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config();


// =====================================================
// APP
// =====================================================

const app = express();

const PORT = 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(__dirname)
);


// =====================================================
// CLOUDINARY
// =====================================================

cloudinary.config({

    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET

});


// =====================================================
// MULTER
// =====================================================

const upload = multer({

    storage:
        multer.memoryStorage(),

    limits: {

        fileSize:
            10 * 1024 * 1024

    }

});


// =====================================================
// ADMIN SETTINGS
// =====================================================

const ADMIN_USERNAME =
    process.env.ADMIN_USERNAME ||
    "admin";


const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD ||
    "Elite@2026";


const ADMIN_SECRET =
    process.env.ADMIN_SECRET ||
    "CHANGE_THIS_SECRET";


// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

function authenticateAdmin(
    req,
    res,
    next
) {

    const authHeader =
        req.headers.authorization;


    if (!authHeader) {

        return res.status(401).json({

            success: false,

            message:
                "Authentication required."

        });

    }


    const token =
        authHeader.startsWith("Bearer ")
            ? authHeader.substring(7)
            : null;


    if (!token) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid authentication token."

        });

    }


    try {

        const decoded =
            jwt.verify(
                token,
                ADMIN_SECRET
            );


        req.admin =
            decoded;


        next();


    } catch (error) {

        return res.status(401).json({

            success: false,

            message:
                "Session expired. Please login again."

        });

    }

}


// =====================================================
// ADMIN LOGIN
// =====================================================

app.post(
    "/api/admin/login",

    (req, res) => {

        const {
            username,
            password
        } = req.body;


        if (
            username !==
                ADMIN_USERNAME ||

            password !==
                ADMIN_PASSWORD
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        const token =
            jwt.sign(

                {

                    username:
                        username,

                    role:
                        "admin"

                },

                ADMIN_SECRET,

                {

                    expiresIn:
                        "8h"

                }

            );


        res.json({

            success: true,

            message:
                "Login successful.",

            token:
                token

        });

    }
);


// =====================================================
// CHECK ADMIN SESSION
// =====================================================

app.get(
    "/api/admin/check",

    authenticateAdmin,

    (req, res) => {

        res.json({

            success: true,

            admin: {

                username:
                    req.admin.username,

                role:
                    req.admin.role

            }

        });

    }
);


// =====================================================
// GET GALLERY
// =====================================================

app.get(
    "/api/gallery",

    async (req, res) => {

        try {

            const result =
                await cloudinary.api.resources({

                    type:
                        "upload",

                    prefix:
                        "elite-cricket-academy/gallery",

                    max_results:
                        100,

                    resource_type:
                        "image"

                });


            const images =
                result.resources.map(
                    image => {

                        // ---------------------------------
                        // PUBLIC ID PARTS
                        // ---------------------------------

                        const parts =
                            image.public_id.split("/");


                        // ---------------------------------
                        // DEFAULT VALUES
                        // ---------------------------------

                        let section =
                            "Academy";


                        let title =
                            "Academy Gallery";


                        // ---------------------------------
                        // CLOUDINARY CONTEXT
                        // ---------------------------------

                        if (
                            image.context &&
                            image.context.custom
                        ) {

                            section =
                                image
                                    .context
                                    .custom
                                    .section ||
                                "Academy";


                            title =
                                image
                                    .context
                                    .custom
                                    .title ||
                                "Academy Gallery";

                        }


                        // ---------------------------------
                        // OLD IMAGE FALLBACK
                        // ---------------------------------

                        if (
                            !image.context &&
                            parts.length >= 4
                        ) {

                            section =
                                parts[3];

                        }


                        // ---------------------------------
                        // RETURN IMAGE
                        // ---------------------------------

                        return {

                            public_id:
                                image.public_id,

                            url:
                                image.secure_url,

                            width:
                                image.width,

                            height:
                                image.height,

                            created_at:
                                image.created_at,

                            section:
                                formatSectionName(
                                    section
                                ),

                            title:
                                title

                        };

                    }
                );


            // ---------------------------------------------
            // NEWEST FIRST
            // ---------------------------------------------

            images.sort(

                (a, b) =>

                    new Date(
                        b.created_at
                    ) -

                    new Date(
                        a.created_at
                    )

            );


            res.json({

                success:
                    true,

                images:
                    images

            });


        } catch (error) {

            console.error(
                "GALLERY ERROR:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Could not load gallery."

            });

        }

    }
);


// =====================================================
// UPLOAD GALLERY IMAGE
// =====================================================

app.post(

    "/api/gallery/upload",

    authenticateAdmin,

    upload.single("image"),

    async (req, res) => {

        try {

            // -------------------------------------------
            // FILE CHECK
            // -------------------------------------------

            if (!req.file) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "No image selected."

                });

            }


            // -------------------------------------------
            // SECTION
            // -------------------------------------------

            let section =
                String(
                    req.body.section ||
                    "Academy"
                ).trim();


            if (!section) {

                section =
                    "Academy";

            }


            // -------------------------------------------
            // TITLE
            // -------------------------------------------

            let title =
                String(
                    req.body.title ||
                    ""
                ).trim();


            if (!title) {

                title =
                    path
                        .parse(
                            req.file.originalname
                        )
                        .name;

            }


            // -------------------------------------------
            // SLUGS
            // -------------------------------------------

            const cleanSection =
                slugify(
                    section
                );


            const cleanTitle =
                slugify(
                    title
                );


            // -------------------------------------------
            // FINAL PUBLIC ID
            // -------------------------------------------

            const publicId =
                `${cleanTitle}-${Date.now()}`;


            // -------------------------------------------
            // CLOUDINARY UPLOAD
            // -------------------------------------------

            const result =
                await new Promise(

                    (resolve, reject) => {

                        const stream =
                            cloudinary
                                .uploader
                                .upload_stream(

                                    {

                                        folder:
                                            `elite-cricket-academy/gallery/${cleanSection}`,

                                        public_id:
                                            publicId,

                                        resource_type:
                                            "image",

                                        // IMPORTANT:
                                        // Save section + title
                                        // inside Cloudinary metadata

                                        context: {

                                            section:
                                                section,

                                            title:
                                                title

                                        }

                                    },

                                    (
                                        error,
                                        result
                                    ) => {

                                        if (error) {

                                            reject(
                                                error
                                            );

                                        } else {

                                            resolve(
                                                result
                                            );

                                        }

                                    }

                                );


                        stream.end(
                            req.file.buffer
                        );

                    }

                );


            // -------------------------------------------
            // SUCCESS
            // -------------------------------------------

            res.json({

                success:
                    true,

                message:
                    "Image uploaded successfully.",

                image: {

                    public_id:
                        result.public_id,

                    url:
                        result.secure_url,

                    section:
                        section,

                    title:
                        title

                }

            });


        } catch (error) {

            console.error(
                "UPLOAD ERROR:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Image upload failed."

            });

        }

    }

);


// =====================================================
// DELETE GALLERY IMAGE
// =====================================================

app.delete(

    "/api/gallery",

    authenticateAdmin,

    async (req, res) => {

        try {

            const {
                public_id
            } = req.body;


            if (!public_id) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Image ID is required."

                });

            }


            await cloudinary
                .uploader
                .destroy(

                    public_id,

                    {

                        resource_type:
                            "image"

                    }

                );


            res.json({

                success:
                    true,

                message:
                    "Image deleted successfully."

            });


        } catch (error) {

            console.error(
                "DELETE ERROR:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Could not delete image."

            });

        }

    }

);


// =====================================================
// SLUGIFY
// =====================================================

function slugify(value) {

    return String(value)

        .toLowerCase()

        .trim()

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )

        .replace(
            /^-+|-+$/g,
            ""
        )

        .substring(
            0,
            60
        );

}


// =====================================================
// FORMAT SECTION NAME
// =====================================================

function formatSectionName(value) {

    return String(value)

        .replace(
            /-/g,
            " "
        )

        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


// =====================================================
// HOME
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


// =====================================================
// ADMIN
// =====================================================

app.get(
    "/admin",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "admin.html"
            )
        );

    }
);


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(

    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "SERVER ERROR:",
            error
        );


        res.status(500).json({

            success:
                false,

            message:
                "Internal server error."

        });

    }

);


// =====================================================
// START SERVER
// =====================================================

app.listen(

    PORT,

    () => {

        console.log("");

        console.log(
            "===================================="
        );

        console.log(
            "🏏 ELITE CRICKET ACADEMY"
        );

        console.log(
            "===================================="
        );

        console.log(
            `🚀 Server running at http://localhost:${PORT}`
        );

        console.log(
            "☁️ Cloudinary Gallery: READY"
        );

        console.log(
            "🔐 Admin Authentication: READY"
        );

        console.log(
            "📧 Admission Form: FormSubmit"
        );

        console.log(
            "===================================="
        );

        console.log("");

    }

);