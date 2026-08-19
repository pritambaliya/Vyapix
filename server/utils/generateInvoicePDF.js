import PDFDocument from "pdfkit";
import https from "https";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================
// FILE PATHS
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsPath = path.join(__dirname, "..", "fonts");

const FONT_REGULAR = path.join(
    fontsPath,
    "NotoSans-Regular.ttf"
);

const FONT_BOLD = path.join(
    fontsPath,
    "NotoSans-Bold.ttf"
);

// ============================================================
// COLORS
// ============================================================

const COLORS = {
    primary: "#111827",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    border: "#E5E7EB",
    tableHeader: "#F3F4F6",
    row: "#F9FAFB",
    white: "#FFFFFF",
};

// ============================================================
// PAGE SETTINGS
// ============================================================

const PAGE = {
    left: 40,
    right: 555,
    width: 515,

    top: 40,

    headerBottom: 195,
    tableTop: 215,
    tableHeaderHeight: 28,

    footerHeight: 58,
    footerGap: 20,

    productLeft: 50,
    productWidth: 245,

    qtyLeft: 315,
    qtyWidth: 40,

    priceLeft: 365,
    priceWidth: 50,

    gstLeft: 425,
    gstWidth: 35,

    totalLeft: 480,
    totalWidth: 65,
};

// ============================================================
// BASIC HELPERS
// ============================================================

const safeText = (value, fallback = "-") => {
    if (value === null || value === undefined) {
        return fallback;
    }

    return String(value);
};

const money = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDate = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

// ============================================================
// DOWNLOAD LOGO
// ============================================================

const downloadImage = (
    url,
    redirectCount = 0
) => {
    return new Promise((resolve, reject) => {
        if (!url) {
            return reject(
                new Error("Logo URL not provided")
            );
        }

        if (redirectCount > 5) {
            return reject(
                new Error("Too many logo redirects")
            );
        }

        const client = url.startsWith("https")
            ? https
            : http;

        const request = client.get(
            url,
            (response) => {
                if (
                    response.statusCode >= 300 &&
                    response.statusCode < 400 &&
                    response.headers.location
                ) {
                    response.resume();

                    return downloadImage(
                        response.headers.location,
                        redirectCount + 1
                    )
                        .then(resolve)
                        .catch(reject);
                }

                if (response.statusCode !== 200) {
                    response.resume();

                    return reject(
                        new Error(
                            `Logo download failed: ${response.statusCode}`
                        )
                    );
                }

                const chunks = [];

                response.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                response.on("end", () => {
                    resolve(
                        Buffer.concat(chunks)
                    );
                });

                response.on("error", reject);
            }
        );

        request.setTimeout(10000, () => {
            request.destroy(
                new Error("Logo download timed out")
            );
        });

        request.on("error", reject);
    });
};

// ============================================================
// DRAW HEADER
// ============================================================

const drawHeader = (
    doc,
    bill,
    shop,
    billingAccount,
    logoBuffer
) => {
    const y = PAGE.top;

    if (logoBuffer) {
        try {
            doc.image(
                logoBuffer,
                PAGE.left,
                y,
                {
                    fit: [70, 70],
                    align: "center",
                    valign: "center",
                }
            );
        } catch (error) {
            console.log(
                "Logo rendering failed:",
                error.message
            );
        }
    }

    const shopX = logoBuffer
        ? 125
        : PAGE.left;

    doc
        .font("NotoBold")
        .fontSize(19)
        .fillColor(COLORS.primary)
        .text(
            safeText(
                shop?.shopName,
                "Shop Name"
            ),
            shopX,
            y,
            {
                width: 270,
                lineBreak: false,
            }
        );

    if (shop?.address) {
        doc
            .font("NotoRegular")
            .fontSize(8)
            .fillColor(COLORS.secondary)
            .text(
                safeText(shop.address),
                shopX,
                y + 28,
                {
                    width: 270,
                    lineGap: 2,
                }
            );
    }

    doc
        .font("NotoRegular")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text(
            `Phone: ${safeText(shop?.phone)}`,
            shopX,
            y + 55,
            {
                lineBreak: false,
            }
        );

    if (shop?.gstNumber) {
        doc.text(
            `GSTIN: ${safeText(
                shop.gstNumber
            )}`,
            shopX,
            y + 70,
            {
                lineBreak: false,
            }
        );
    }

    doc
        .font("NotoBold")
        .fontSize(24)
        .fillColor(COLORS.primary)
        .text(
            "INVOICE",
            390,
            y,
            {
                width: 165,
                align: "right",
                lineBreak: false,
            }
        );

    doc
        .font("NotoRegular")
        .fontSize(8.5)
        .fillColor(COLORS.secondary)
        .text(
            `Invoice No: ${safeText(
                bill?.invoiceNumber
            )}`,
            390,
            y + 36,
            {
                width: 165,
                align: "right",
                lineBreak: false,
            }
        );

    doc.text(
        `Date: ${formatDate(
            bill?.createdAt
        )}`,
        390,
        y + 52,
        {
            width: 165,
            align: "right",
            lineBreak: false,
        }
    );

    doc
        .moveTo(PAGE.left, 125)
        .lineTo(PAGE.right, 125)
        .lineWidth(1)
        .strokeColor(COLORS.border)
        .stroke();

    const infoY = 145;

    doc
        .font("NotoBold")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
            "BILL TO",
            PAGE.left,
            infoY,
            {
                lineBreak: false,
            }
        );

    doc
        .font("NotoBold")
        .fontSize(10.5)
        .fillColor(COLORS.primary)
        .text(
            safeText(
                bill?.customerName,
                "Walk-in Customer"
            ),
            PAGE.left,
            infoY + 17,
            {
                width: 250,
            }
        );

    if (bill?.customerPhone) {
        doc
            .font("NotoRegular")
            .fontSize(8)
            .fillColor(COLORS.secondary)
            .text(
                safeText(
                    bill.customerPhone
                ),
                PAGE.left,
                infoY + 36,
                {
                    lineBreak: false,
                }
            );
    }

    doc
        .font("NotoBold")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
            "BILLING COUNTER",
            350,
            infoY,
            {
                lineBreak: false,
            }
        );

    doc
        .font("NotoBold")
        .fontSize(9)
        .fillColor(COLORS.primary)
        .text(
            billingAccount
                ? `${safeText(
                    billingAccount.accountNumber
                )} - ${safeText(
                    billingAccount.name
                )}`
                : "-",
            350,
            infoY + 17,
            {
                width: 205,
            }
        );
};

// ============================================================
// DRAW TABLE HEADER
// ============================================================

const drawTableHeader = (
    doc,
    y
) => {
    doc
        .roundedRect(
            PAGE.left,
            y,
            PAGE.width,
            PAGE.tableHeaderHeight,
            4
        )
        .fillColor(COLORS.tableHeader)
        .fill();

    doc
        .font("NotoBold")
        .fontSize(8)
        .fillColor(COLORS.primary);

    doc.text(
        "PRODUCT",
        50,
        y + 9,
        {
            lineBreak: false,
        }
    );

    doc.text(
        "QTY",
        315,
        y + 9,
        {
            width: 40,
            align: "center",
            lineBreak: false,
        }
    );

    doc.text(
        "PRICE",
        365,
        y + 9,
        {
            width: 50,
            align: "right",
            lineBreak: false,
        }
    );

    doc.text(
        "GST",
        425,
        y + 9,
        {
            width: 35,
            align: "right",
            lineBreak: false,
        }
    );

    doc.text(
        "TOTAL",
        480,
        y + 9,
        {
            width: 65,
            align: "right",
            lineBreak: false,
        }
    );
};

// ============================================================
// DRAW PAGE TOP
// ============================================================

const drawPageTop = (
    doc,
    bill,
    shop,
    billingAccount,
    logoBuffer
) => {
    drawHeader(
        doc,
        bill,
        shop,
        billingAccount,
        logoBuffer
    );

    drawTableHeader(
        doc,
        PAGE.tableTop
    );

    return (
        PAGE.tableTop +
        PAGE.tableHeaderHeight +
        10
    );
};

// ============================================================
// MEASURE PRODUCT ROW
// ============================================================

const getProductRowHeight = (
    doc,
    item
) => {
    const productName = safeText(
        item?.name,
        "Product"
    );

    doc
        .font("NotoRegular")
        .fontSize(8.5);

    const productHeight =
        doc.heightOfString(
            productName,
            {
                width: PAGE.productWidth,
                lineGap: 1,
            }
        );

    return Math.max(
        30,
        productHeight + 12
    );
};

// ============================================================
// DRAW PRODUCT ROW
// ============================================================

const drawProductRow = (
    doc,
    item,
    index,
    y,
    rowHeight
) => {
    if (index % 2 === 0) {
        doc
            .rect(
                PAGE.left,
                y - 5,
                PAGE.width,
                rowHeight
            )
            .fillColor(COLORS.row)
            .fill();
    }

    doc
        .font("NotoRegular")
        .fontSize(8.5)
        .fillColor(COLORS.primary)
        .text(
            safeText(
                item?.name,
                "Product"
            ),
            PAGE.productLeft,
            y,
            {
                width: PAGE.productWidth,
                lineGap: 1,
            }
        );

    doc.text(
        String(item?.quantity || 0),
        PAGE.qtyLeft,
        y,
        {
            width: PAGE.qtyWidth,
            align: "center",
            lineBreak: false,
        }
    );

    doc.text(
        money(item?.unitPrice),
        PAGE.priceLeft,
        y,
        {
            width: PAGE.priceWidth,
            align: "right",
            lineBreak: false,
        }
    );

    doc.text(
        `${Number(
            item?.gstRate || 0
        )}%`,
        PAGE.gstLeft,
        y,
        {
            width: PAGE.gstWidth,
            align: "right",
            lineBreak: false,
        }
    );

    doc
        .font("NotoBold")
        .fontSize(8.5)
        .text(
            money(item?.total),
            PAGE.totalLeft,
            y,
            {
                width: PAGE.totalWidth,
                align: "right",
                lineBreak: false,
            }
        );
};

// ============================================================
// DRAW TABLE BORDER
// ============================================================

const drawTableBottomBorder = (
    doc,
    y
) => {
    doc
        .moveTo(PAGE.left, y)
        .lineTo(PAGE.right, y)
        .lineWidth(0.8)
        .strokeColor(COLORS.border)
        .stroke();
};

// ============================================================
// TOTALS
// ============================================================

const getTotalsHeight = (bill) => {
    const hasDiscount =
        Number(bill?.discount || 0) > 0;

    const rows = hasDiscount ? 3 : 2;

    return (
        rows * 19 +
        5 +
        46
    );
};

const drawTotals = (
    doc,
    bill,
    y
) => {
    let currentY = y;

    const drawRow = (
        label,
        value
    ) => {
        doc
            .font("NotoRegular")
            .fontSize(9)
            .fillColor(COLORS.primary)
            .text(
                label,
                350,
                currentY,
                {
                    width: 90,
                    lineBreak: false,
                }
            );

        doc.text(
            money(value),
            445,
            currentY,
            {
                width: 100,
                align: "right",
                lineBreak: false,
            }
        );

        currentY += 19;
    };

    drawRow(
        "Subtotal",
        bill?.subtotal
    );

    drawRow(
        "GST",
        bill?.gstTotal
    );

    if (
        Number(
            bill?.discount || 0
        ) > 0
    ) {
        drawRow(
            "Discount",
            bill?.discount
        );
    }

    const grandTotalY =
        currentY + 5;

    doc
        .roundedRect(
            340,
            grandTotalY,
            205,
            46,
            5
        )
        .fillColor(COLORS.primary)
        .fill();

    doc
        .font("NotoBold")
        .fontSize(10)
        .fillColor(COLORS.white)
        .text(
            "GRAND TOTAL",
            353,
            grandTotalY + 16,
            {
                lineBreak: false,
            }
        );

    doc
        .font("NotoBold")
        .fontSize(13)
        .fillColor(COLORS.white)
        .text(
            money(bill?.grandTotal),
            430,
            grandTotalY + 14,
            {
                width: 100,
                align: "right",
                lineBreak: false,
            }
        );

    return grandTotalY + 46;
};

// ============================================================
// PAYMENT
// ============================================================

const drawPayment = (
    doc,
    bill,
    y
) => {
    doc
        .font("NotoBold")
        .fontSize(9)
        .fillColor(COLORS.primary)
        .text(
            "PAYMENT",
            PAGE.left,
            y,
            {
                lineBreak: false,
            }
        );

    doc
        .font("NotoRegular")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text(
            `Method: ${
                bill?.paymentMethod
                    ? String(
                        bill.paymentMethod
                    ).toUpperCase()
                    : "-"
            }`,
            PAGE.left,
            y + 18,
            {
                lineBreak: false,
            }
        );

    doc.text(
        `Status: ${
            bill?.paymentStatus
                ? String(
                    bill.paymentStatus
                ).toUpperCase()
                : "-"
        }`,
        PAGE.left,
        y + 34,
        {
            lineBreak: false,
        }
    );

    return y + 52;
};

// ============================================================
// NOTES
// ============================================================

const getNotesHeight = (
    doc,
    bill
) => {
    if (!bill?.notes) {
        return 0;
    }

    doc
        .font("NotoRegular")
        .fontSize(8);

    const notesHeight =
        doc.heightOfString(
            String(bill.notes),
            {
                width: PAGE.width,
                lineGap: 2,
            }
        );

    return (
        17 +
        notesHeight +
        10
    );
};

const drawNotes = (
    doc,
    bill,
    y
) => {
    if (!bill?.notes) {
        return y;
    }

    doc
        .font("NotoBold")
        .fontSize(9)
        .fillColor(COLORS.primary)
        .text(
            "NOTES",
            PAGE.left,
            y,
            {
                lineBreak: false,
            }
        );

    doc
        .font("NotoRegular")
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text(
            String(bill.notes),
            PAGE.left,
            y + 17,
            {
                width: PAGE.width,
                lineGap: 2,
            }
        );

    return y + getNotesHeight(
        doc,
        bill
    );
};

// ============================================================
// FOOTER
// ============================================================

const drawFooter = (
    doc,
    pageNumber,
    totalPages
) => {
    const footerY =
        doc.page.height -
        PAGE.footerHeight;

    doc.save();

    // Reset PDFKit's flowing cursor.
    doc.x = PAGE.left;
    doc.y = footerY;

    doc
        .moveTo(PAGE.left, footerY)
        .lineTo(PAGE.right, footerY)
        .lineWidth(0.7)
        .strokeColor(COLORS.border)
        .stroke();

    // Thank You
    doc
        .font("NotoBold")
        .fontSize(9)
        .fillColor(COLORS.primary);

    doc.x = PAGE.left;
    doc.y = footerY + 10;

    doc.text(
        "Thank You! Visit Again.",
        PAGE.left,
        footerY + 10,
        {
            width: PAGE.width,
            height: 12,
            align: "center",
            lineBreak: false,
            continued: false,
        }
    );

    // Powered by
    doc
        .font("NotoRegular")
        .fontSize(7)
        .fillColor(COLORS.muted);

    doc.x = PAGE.left;
    doc.y = footerY + 29;

    doc.text(
        "Powered by Vyapix",
        PAGE.left,
        footerY + 29,
        {
            width: 200,
            height: 10,
            align: "left",
            lineBreak: false,
            continued: false,
        }
    );

    // Page number
    doc.x = 440;
    doc.y = footerY + 29;

    doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        440,
        footerY + 29,
        {
            width: 75,
            height: 10,
            align: "right",
            lineBreak: false,
            continued: false,
        }
    );

    doc.restore();
};

// ============================================================
// MAIN FUNCTION
// ============================================================

const generateInvoicePDF = async (
    bill,
    shop,
    billingAccount,
    res
) => {
    const doc = new PDFDocument({
        size: "A4",
        margin: 40,

        // Required because page count is known only
        // after all content has been generated.
        bufferPages: true,
    });

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeText(
            bill?.invoiceNumber,
            "invoice"
        )}.pdf"`
    );

    doc.pipe(res);

    doc.registerFont(
        "NotoRegular",
        FONT_REGULAR
    );

    doc.registerFont(
        "NotoBold",
        FONT_BOLD
    );

    let logoBuffer = null;

    if (shop?.logo?.url) {
        try {
            logoBuffer =
                await downloadImage(
                    shop.logo.url
                );
        } catch (error) {
            console.log(
                "Logo could not be loaded:",
                error.message
            );
        }
    }

    const items = Array.isArray(
        bill?.items
    )
        ? bill.items
        : [];

    // --------------------------------------------------------
    // FIRST PAGE
    // --------------------------------------------------------

    let tableY = drawPageTop(
        doc,
        bill,
        shop,
        billingAccount,
        logoBuffer
    );

    const productBottom =
        doc.page.height -
        PAGE.footerHeight -
        PAGE.footerGap;

    // --------------------------------------------------------
    // PRODUCTS
    // --------------------------------------------------------

    for (
        let index = 0;
        index < items.length;
        index++
    ) {
        const item = items[index];

        const rowHeight =
            getProductRowHeight(
                doc,
                item
            );

        if (
            tableY + rowHeight >
            productBottom
        ) {
            drawTableBottomBorder(
                doc,
                tableY
            );

            doc.addPage();

            tableY = drawPageTop(
                doc,
                bill,
                shop,
                billingAccount,
                logoBuffer
            );
        }

        drawProductRow(
            doc,
            item,
            index,
            tableY,
            rowHeight
        );

        tableY += rowHeight;
    }

    drawTableBottomBorder(
        doc,
        tableY
    );

    // --------------------------------------------------------
    // FINAL CONTENT MEASUREMENT
    // --------------------------------------------------------

    const totalsHeight =
        getTotalsHeight(bill);

    const paymentHeight = 52;

    const notesHeight =
        getNotesHeight(
            doc,
            bill
        );

    const finalContentHeight =
        20 +
        totalsHeight +
        24 +
        paymentHeight +
        10 +
        notesHeight;

    const finalContentBottom =
        tableY +
        finalContentHeight;

    // --------------------------------------------------------
    // MOVE FINAL CONTENT IF NECESSARY
    // --------------------------------------------------------

    if (
        finalContentBottom >
        productBottom
    ) {
        doc.addPage();

        tableY = drawPageTop(
            doc,
            bill,
            shop,
            billingAccount,
            logoBuffer
        );
    }

    // --------------------------------------------------------
    // TOTALS
    // --------------------------------------------------------

    let bottomY = drawTotals(
        doc,
        bill,
        tableY + 20
    );

    // --------------------------------------------------------
    // PAYMENT
    // --------------------------------------------------------

    bottomY += 24;

    bottomY = drawPayment(
        doc,
        bill,
        bottomY
    );

    // --------------------------------------------------------
    // NOTES
    // --------------------------------------------------------

    bottomY += 10;

    drawNotes(
        doc,
        bill,
        bottomY
    );

    // --------------------------------------------------------
    // FOOTERS
    // --------------------------------------------------------

    const pageRange =
        doc.bufferedPageRange();

    const totalPages =
        pageRange.count;

    for (
        let pageIndex = pageRange.start;
        pageIndex <
        pageRange.start +
        pageRange.count;
        pageIndex++
    ) {
        doc.switchToPage(
            pageIndex
        );

        drawFooter(
            doc,
            pageIndex -
                pageRange.start +
                1,
            totalPages
        );
    }

    // Finish PDF.
    doc.end();
};

export default generateInvoicePDF;