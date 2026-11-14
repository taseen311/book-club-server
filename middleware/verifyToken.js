
import { jwtVerify, createRemoteJWKSet } from "jose";

const AUTH_URL =
    process.env.BETTER_AUTH_URL || "http://localhost:3000";

const JWKS = createRemoteJWKSet(
    new URL(`${AUTH_URL}/api/auth/jwks`)
);

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized access. Token required.",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: AUTH_URL,
            audience: AUTH_URL,
        });

        req.user = payload;

        next();

    } catch (error) {
        console.error("JWT Verification Error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired token.",
        });
    }
};
