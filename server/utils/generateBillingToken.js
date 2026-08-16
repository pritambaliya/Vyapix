import jwt from "jsonwebtoken";

const generateBillingToken = (billingAccount) => {
    return jwt.sign(
        {
            billingAccountId: billingAccount._id,
            ownerId: billingAccount.ownerId,
            shopId: billingAccount.shopId,
            role: "billing",
        },
        process.env.BILLING_JWT_SECRET,
        {
            expiresIn: "12h",
        }
    );
};

export default generateBillingToken;