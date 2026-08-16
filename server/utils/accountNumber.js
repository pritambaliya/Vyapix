import BillingAccount from "../models/billingAccount.model.js";

export const generateAccountNumber = async (shopId) => {
    const lastAccount = await BillingAccount.findOne({
        shopId,
    }).sort({
        createdAt: -1,
    });

    let nextNumber = 1;

    if (lastAccount?.accountNumber) {
        const number = parseInt(lastAccount.accountNumber.replace("BILL-", ""), 10);

        if (!isNaN(number)) {
            nextNumber = number + 1;
        }
    }

    return `BILL-${String(nextNumber).padStart(4, "0")}`;
};