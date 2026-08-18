import PDFDocument from "pdfkit";
import https from "https";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regularFont = path.join(
    __dirname,
    "../fonts/NotoSans-Regular.ttf"
);

const boldFont = path.join(
    __dirname,
    "../fonts/NotoSans-Bold.ttf"
);


const downloadImage = (url) => {
    return new Promise((resolve, reject) => {

        const client = url.startsWith("https")
            ? https
            : http;

        client.get(url, (response) => {

            if (response.statusCode !== 200) {
                reject(
                    new Error(
                        `Logo download failed: ${response.statusCode}`
                    )
                );
                return;
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


const generateThermalInvoice = async (
    bill,
    shop,
    billingAccount,
    res
) => {

    const WIDTH = 226;

    const doc = new PDFDocument({
        size: [WIDTH, 1000],
        margin: 12,
    });

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${bill.invoiceNumber}-thermal.pdf"`
    );

    doc.pipe(res);

    doc.registerFont(
        "Noto",
        regularFont
    );

    doc.registerFont(
        "Noto-Bold",
        boldFont
    );

    const LEFT = 12;
    const RIGHT = 214;
    const CONTENT_WIDTH = 202;

    const money = (value) => {

        return `₹${Number(
            value || 0
        ).toFixed(2)}`;
    };


    const center = (
        text,
        size = 9,
        bold = false
    ) => {

        doc
            .font(
                bold
                    ? "Noto-Bold"
                    : "Noto"
            )
            .fontSize(size)
            .fillColor("#000000")
            .text(
                String(text || ""),
                LEFT,
                doc.y,
                {
                    width: CONTENT_WIDTH,
                    align: "center",
                }
            );
    };


    const divider = () => {
        doc
            .moveDown(0.5)
            .moveTo(
                LEFT,
                doc.y
            )
            .lineTo(
                RIGHT,
                doc.y
            )
            .lineWidth(0.6)
            .strokeColor("#555555")
            .stroke()
            .moveDown(0.5);
    };

    const row = (label, value, bold = false) => {

        const y = doc.y;

        doc
            .font(
                bold
                    ? "Noto-Bold"
                    : "Noto"
            )
            .fontSize(
                bold ? 9.5 : 8.5
            )
            .fillColor("#000000");

        // Label
        doc.text(
            label,
            LEFT,
            y,
            {
                width: 105,
            }
        );

        // Amount
        doc.text(
            value,
            120,
            y,
            {
                width: 94,
                align: "right",
            }
        );

        doc.y += 15;
    };

    if (shop.logo?.url) {

        try {

            const logo =
                await downloadImage(
                    shop.logo.url
                );

            doc.image(
                logo,
                88,
                doc.y,
                {
                    fit: [50, 50],
                }
            );

            doc.y += 55;

        } catch (error) {

            console.log(
                "Logo error:",
                error.message
            );
        }
    }

    center(
        shop.shopName || "YOUR SHOP",
        15,
        true
    );

    doc.moveDown(0.3);

    if (shop.address) {
        center(
            shop.address,
            8
        );
    }

    if (shop.phone) {
        center(
            `Phone: ${shop.phone}`,
            8
        );
    }

    if (shop.gstNumber) {
        center(
            `GSTIN: ${shop.gstNumber}`,
            8
        );
    }


    divider();

    center(
        "TAX INVOICE",
        12,
        true
    );

    doc.moveDown(0.4);

    row(
        "Invoice",
        bill.invoiceNumber
    );

    row(
        "Date",
        new Date(
            bill.createdAt
        ).toLocaleString("en-IN")
    );


    if (billingAccount) {

        row(
            "Counter",
            billingAccount.accountNumber
        );

        row(
            "Cashier",
            billingAccount.name
        );
    }


    if (bill.customerName) {

        row(
            "Customer",
            bill.customerName
        );
    }


    if (bill.customerPhone) {

        row(
            "Phone",
            bill.customerPhone
        );
    }


    divider();

    const headerY = doc.y;


    doc
        .font("Noto-Bold")
        .fontSize(8.5);


    doc.text(
        "ITEM",
        LEFT,
        headerY,
        {
            width: 115,
        }
    );


    doc.text(
        "QTY",
        127,
        headerY,
        {
            width: 30,
            align: "center",
        }
    );


    doc.text(
        "AMOUNT",
        157,
        headerY,
        {
            width: 57,
            align: "right",
        }
    );


    doc.y =
        headerY + 16;


    divider();

    bill.items.forEach((item) => {

        const name =
            item.name || "Product";

        const quantity =
            Number(item.quantity || 0);

        const unitPrice =
            Number(item.unitPrice || 0);

        const total =
            Number(item.total || 0);

        const gstRate =
            Number(item.gstRate || 0);


        const itemY = doc.y;

        doc
            .font("Noto-Bold")
            .fontSize(8.5)
            .fillColor("#000000")
            .text(
                name,
                LEFT,
                itemY,
                {
                    width: 115,
                }
            );

        doc
            .font("Noto")
            .fontSize(8.5)
            .text(
                String(quantity),
                127,
                itemY,
                {
                    width: 30,
                    align: "center",
                }
            );

        doc
            .font("Noto-Bold")
            .fontSize(8.5)
            .text(
                money(total),
                157,
                itemY,
                {
                    width: 57,
                    align: "right",
                }
            );


        const nameHeight =
            doc.heightOfString(
                name,
                {
                    width: 115,
                }
            );


        doc.y =
            itemY +
            nameHeight +
            2;

        doc
            .font("Noto")
            .fontSize(7.5)
            .fillColor("#555555")
            .text(
                `${money(unitPrice)} each`,
                LEFT,
                doc.y,
                {
                    width: 115,
                }
            );


        doc.text(
            `GST ${gstRate}%`,
            127,
            doc.y,
            {
                width: 87,
                align: "right",
            }
        );


        doc.y += 15;

        doc.fillColor("#000000");
    });

    divider();


    row(
        "Subtotal",
        money(bill.subtotal)
    );

    row(
        "GST",
        money(bill.gstTotal)
    );

    row(
        "Discount",
        money(bill.discount)
    );


    doc.moveDown(0.3);


    const totalY = doc.y;


    doc
        .roundedRect(
            LEFT,
            totalY,
            CONTENT_WIDTH,
            38,
            4
        )
        .fillColor("#111111")
        .fill();


    doc
        .font("Noto-Bold")
        .fontSize(11)
        .fillColor("#FFFFFF")
        .text(
            "TOTAL",
            20,
            totalY + 11,
            {
                width: 65,
            }
        );


    doc.text(
        money(bill.grandTotal),
        105,
        totalY + 9,
        {
            width: 95,
            align: "right",
        }
    );


    doc.y =
        totalY + 48;


    center(
        `Payment: ${
            bill.paymentMethod
                ? bill.paymentMethod.toUpperCase()
                : "-"
        }`,
        9,
        true
    );

    center(
        `Status: ${
            bill.paymentStatus
                ? bill.paymentStatus.toUpperCase()
                : "-"
        }`,
        8
    );


    if (bill.notes) {

        divider();

        doc
            .font("Noto-Bold")
            .fontSize(8)
            .text("NOTE");

        doc
            .font("Noto")
            .fontSize(8)
            .text(
                bill.notes,
                {
                    width: CONTENT_WIDTH,
                }
            );
    }

    divider();

    center(
        "Thank You!",
        12,
        true
    );

    doc.moveDown(0.2);

    center(
        "Visit Again",
        9,
        true
    );

    doc.moveDown(0.7);

    center(
        "Powered by",
        7
    );

    center(
        "VYAPIX",
        10,
        true
    );


    doc.end();
};


export default generateThermalInvoice;