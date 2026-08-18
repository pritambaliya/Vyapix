import PDFDocument from "pdfkit";
import https from "https";
import http from "http";

const downloadImage = (url) => {
    return new Promise((resolve, reject) => {
        if (!url) {
            return reject(new Error("Logo URL not provided"));
        }

        const client = url.startsWith("https")
            ? https
            : http;

        client.get(url, (response) => {
            if (response.statusCode !== 200) {
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
                resolve(Buffer.concat(chunks));
            });

            response.on("error", reject);
        }).on("error", reject);
    });
};


const generateInvoicePDF = async (
    bill,
    shop,
    billingAccount,
    res
) => {

    const doc = new PDFDocument({
        size: "A4",
        margin: 40,

        // Automatically add pages when required
        bufferPages: true,
    });


    // =========================================
    // RESPONSE HEADERS
    // =========================================

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${bill.invoiceNumber}.pdf"`
    );


    doc.pipe(res);


    // =========================================
    // COLORS
    // =========================================

    const primaryColor = "#1F2937";
    const secondaryColor = "#6B7280";
    const borderColor = "#D1D5DB";
    const lightBackground = "#F3F4F6";


    // =========================================
    // SHOP LOGO
    // =========================================

    let logoBuffer = null;

    if (shop.logo?.url) {
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

            // Continue without logo
        }
    }


    // =========================================
    // HEADER
    // =========================================

    const headerTop = 40;

    if (logoBuffer) {

        try {

            doc.image(
                logoBuffer,
                40,
                headerTop,
                {
                    fit: [80, 80],
                    align: "center",
                    valign: "center",
                }
            );

        } catch (error) {

            console.log(
                "Invalid logo image:",
                error.message
            );
        }
    }


    // Shop information starts dynamically
    const shopInfoX =
        logoBuffer ? 140 : 40;


    doc
        .fillColor(primaryColor)
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(
            shop.shopName || "Shop Name",
            shopInfoX,
            headerTop
        );


    doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .font("Helvetica")
        .text(
            shop.address || "",
            shopInfoX,
            headerTop + 28,
            {
                width: 400,
            }
        );


    doc.text(
        `Phone: ${shop.phone || "-"}`,
        shopInfoX,
        headerTop + 43
    );


    if (shop.gstNumber) {

        doc.text(
            `GSTIN: ${shop.gstNumber}`,
            shopInfoX,
            headerTop + 58
        );
    }


    // =========================================
    // INVOICE TITLE
    // =========================================

    doc
        .fillColor(primaryColor)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(
            "INVOICE",
            420,
            headerTop,
            {
                width: 130,
                align: "right",
            }
        );


    doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .font("Helvetica")
        .text(
            bill.invoiceNumber,
            420,
            headerTop + 30,
            {
                width: 130,
                align: "right",
            }
        );


    doc.text(
        new Date(
            bill.createdAt
        ).toLocaleDateString("en-IN"),
        420,
        headerTop + 45,
        {
            width: 130,
            align: "right",
        }
    );


    // =========================================
    // HEADER DIVIDER
    // =========================================

    doc
        .moveTo(40, 125)
        .lineTo(555, 125)
        .lineWidth(1)
        .strokeColor(borderColor)
        .stroke();


    doc.y = 145;


    // =========================================
    // CUSTOMER + COUNTER INFORMATION
    // =========================================

    const infoTop = doc.y;


    // Customer
    doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
            "BILL TO",
            40,
            infoTop
        );


    doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .font("Helvetica")
        .text(
            bill.customerName ||
            "Walk-in Customer",
            40,
            infoTop + 18
        );


    if (bill.customerPhone) {

        doc.text(
            bill.customerPhone,
            40,
            infoTop + 33
        );
    }


    // Counter
    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .text(
            "BILLING COUNTER",
            350,
            infoTop
        );


    doc
        .fillColor(secondaryColor)
        .font("Helvetica")
        .text(
            billingAccount
                ? `${billingAccount.accountNumber} - ${billingAccount.name}`
                : "-",
            350,
            infoTop + 18,
            {
                width: 205,
            }
        );


    doc.y = infoTop + 65;


    // =========================================
    // TABLE
    // =========================================

    const tableX = 40;

    const productX = 40;
    const qtyX = 320;
    const priceX = 365;
    const gstX = 425;
    const totalX = 480;

    const tableWidth = 515;


    const drawTableHeader = () => {

        const y = doc.y;

        doc
            .roundedRect(
                tableX,
                y,
                tableWidth,
                25,
                3
            )
            .fillColor(lightBackground)
            .fill();


        doc
            .fillColor(primaryColor)
            .fontSize(9)
            .font("Helvetica-Bold");


        doc.text(
            "Product",
            productX + 8,
            y + 8
        );


        doc.text(
            "Qty",
            qtyX,
            y + 8,
            {
                width: 35,
                align: "center",
            }
        );


        doc.text(
            "Price",
            priceX,
            y + 8,
            {
                width: 50,
                align: "right",
            }
        );


        doc.text(
            "GST",
            gstX,
            y + 8,
            {
                width: 35,
                align: "right",
            }
        );


        doc.text(
            "Total",
            totalX,
            y + 8,
            {
                width: 65,
                align: "right",
            }
        );


        doc.y = y + 32;
    };


    drawTableHeader();


    // =========================================
    // TABLE ITEMS
    // =========================================

    doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(primaryColor);


    bill.items.forEach((item, index) => {

        const productName =
            item.name || "Product";


        const productHeight =
            doc.heightOfString(
                productName,
                {
                    width: 250,
                }
            );


        const rowHeight =
            Math.max(
                25,
                productHeight + 10
            );


        // Check page space
        if (
            doc.y + rowHeight >
            doc.page.height - 100
        ) {

            doc.addPage();

            doc.y = 40;

            drawTableHeader();
        }


        const y = doc.y;


        // Alternating row background
        if (index % 2 === 0) {

            doc
                .rect(
                    tableX,
                    y - 5,
                    tableWidth,
                    rowHeight
                )
                .fillColor("#F9FAFB")
                .fill();
        }


        doc
            .fillColor(primaryColor)
            .font("Helvetica")
            .fontSize(9);


        // Product
        doc.text(
            productName,
            productX + 8,
            y,
            {
                width: 250,
            }
        );


        // Quantity
        doc.text(
            String(item.quantity),
            qtyX,
            y,
            {
                width: 35,
                align: "center",
            }
        );


        // Price
        doc.text(
            `₹${Number(
                item.unitPrice || 0
            ).toFixed(2)}`,
            priceX,
            y,
            {
                width: 50,
                align: "right",
            }
        );


        // GST
        doc.text(
            `${Number(
                item.gstRate || 0
            )}%`,
            gstX,
            y,
            {
                width: 35,
                align: "right",
            }
        );


        // Total
        doc.text(
            `₹${Number(
                item.total || 0
            ).toFixed(2)}`,
            totalX,
            y,
            {
                width: 65,
                align: "right",
            }
        );


        doc.y =
            y + rowHeight;
    });


    // =========================================
    // TABLE BOTTOM BORDER
    // =========================================

    doc
        .moveTo(
            tableX,
            doc.y
        )
        .lineTo(
            tableX + tableWidth,
            doc.y
        )
        .strokeColor(borderColor)
        .stroke();


    doc.moveDown(1.5);


    // =========================================
    // TOTALS SECTION
    // =========================================

    const totalsTop = doc.y;


    doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font("Helvetica");


    const drawTotal = (
        label,
        value,
        bold = false
    ) => {

        doc
            .font(
                bold
                    ? "Helvetica-Bold"
                    : "Helvetica"
            )
            .text(
                label,
                350,
                doc.y,
                {
                    width: 90,
                }
            );


        doc.text(
            `₹${Number(
                value || 0
            ).toFixed(2)}`,
            455,
            doc.y,
            {
                width: 90,
                align: "right",
            }
        );


        doc.moveDown(0.6);
    };


    drawTotal(
        "Subtotal",
        bill.subtotal
    );


    drawTotal(
        "GST",
        bill.gstTotal
    );


    drawTotal(
        "Discount",
        bill.discount
    );


    // Grand Total box

    const grandTotalY = doc.y;


    doc
        .roundedRect(
            340,
            grandTotalY,
            205,
            38,
            4
        )
        .fillColor(primaryColor)
        .fill();


    doc
        .fillColor("#FFFFFF")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(
            "Grand Total",
            350,
            grandTotalY + 12
        );


    doc.text(
        `₹${Number(
            bill.grandTotal || 0
        ).toFixed(2)}`,
        440,
        grandTotalY + 10,
        {
            width: 95,
            align: "right",
        }
    );


    doc.y =
        grandTotalY + 60;


    // =========================================
    // PAYMENT
    // =========================================

    doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("PAYMENT");


    doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .font("Helvetica")
        .text(
            `Method: ${
                bill.paymentMethod
                    ? bill.paymentMethod
                        .toUpperCase()
                    : "-"
            }`
        );


    doc.text(
        `Status: ${
            bill.paymentStatus
                ? bill.paymentStatus
                    .toUpperCase()
                : "-"
        }`
    );


    // =========================================
    // NOTES
    // =========================================

    if (bill.notes) {

        doc.moveDown(1);

        doc
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .text("Notes");


        doc
            .fillColor(secondaryColor)
            .font("Helvetica")
            .text(
                bill.notes,
                {
                    width: 500,
                }
            );
    }


    // =========================================
    // FOOTER
    // =========================================

    const footerY =
        doc.page.height - 70;


    doc
        .moveTo(40, footerY - 15)
        .lineTo(555, footerY - 15)
        .strokeColor(borderColor)
        .stroke();


    doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
            "Thank You! Visit Again.",
            40,
            footerY,
            {
                width: 515,
                align: "center",
            }
        );


    doc
        .fillColor(secondaryColor)
        .fontSize(8)
        .font("Helvetica")
        .text(
            "Powered by Vyapix",
            40,
            footerY + 18,
            {
                width: 515,
                align: "center",
            }
        );


    // =========================================
    // PAGE NUMBERS
    // =========================================

    const range =
        doc.bufferedPageRange();


    for (
        let i = range.start;
        i < range.start + range.count;
        i++
    ) {

        doc.switchToPage(i);

        doc
            .fontSize(8)
            .fillColor(secondaryColor)
            .text(
                `Page ${
                    i + 1
                } of ${
                    range.count
                }`,
                40,
                doc.page.height - 30,
                {
                    width: 515,
                    align: "right",
                }
            );
    }


    doc.end();
};


export default generateInvoicePDF;