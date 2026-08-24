import BillingAccount from "../models/billingAccount.model.js";

export const generateAccountNumber = async (shopId) => {
    const lastAccount = await BillingAccount.findOne().sort({
        createdAt: -1,
    });

    let nextNumber = 1;

    if (lastAccount?.accountNumber) {
        const number = parseInt(lastAccount.accountNumber.replace("BILL-", ""), 10);

        if (!isNaN(number)) {
            nextNumber = number + 1;
        }
    }

    let accNo = `BILL-${String(nextNumber).padStart(4, "0")}`;
    while (await BillingAccount.exists({ accountNumber: accNo })) {
        nextNumber++;
        accNo = `BILL-${String(nextNumber).padStart(4, "0")}`;
    }

    return accNo;
};
