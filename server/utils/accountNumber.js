import BillingAccount from "../models/billingAccount.model.js";

/**
 * Generates a unique sequential billing account number scoped to a specific shop.
 * Format: BILL-NNNN (e.g. BILL-0001, BILL-0002 … per shop)
 *
 * FIX H-3: The original version queried ALL BillingAccounts globally and ignored
 * the shopId parameter, producing globally sequential numbers instead of
 * per-shop ones. Now we filter by shopId so each shop gets its own sequence.
 */
export const generateAccountNumber = async (shopId) => {
    // Find the most recently created account for THIS specific shop
    const lastAccount = await BillingAccount.findOne({ shopId }).sort({
        createdAt: -1,
    });

    let nextNumber = 1;

    if (lastAccount?.accountNumber) {
        const number = parseInt(
            lastAccount.accountNumber.replace("BILL-", ""),
            10
        );

        if (!isNaN(number)) {
            nextNumber = number + 1;
        }
    }

    // Collision guard: increment until we find an unused number for this shop
    let accNo = `BILL-${String(nextNumber).padStart(4, "0")}`;

    while (await BillingAccount.exists({ shopId, accountNumber: accNo })) {
        nextNumber++;
        accNo = `BILL-${String(nextNumber).padStart(4, "0")}`;
    }

    return accNo;
};
