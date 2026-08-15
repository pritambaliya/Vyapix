import jwt from "jsonwebtoken";

const generateToken = (ownerId) => {
    return jwt.sign(
        {
            ownerId,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

export default generateToken;