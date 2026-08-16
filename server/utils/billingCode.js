import crypto from "crypto";

export const generateBillingCode = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
        code += characters.charAt(
            crypto.randomInt(0, characters.length)
        );
    }

    return `VXP-${code}`;
};