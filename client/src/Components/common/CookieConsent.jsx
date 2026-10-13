import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "vyapix_cookie_consent_v1";

function readConsent() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn("Could not read cookie preferences:", error);
        return null;
    }
}

export default function CookieConsent() {
    const [consent, setConsent] = useState(null);
    const [bannerOpen, setBannerOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState("");
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    const previousFocus = useRef(null);
    const toastTimer = useRef(null);

    // Load previously saved consent
    useEffect(() => {
        const saved = readConsent();
        setConsent(saved);
        setBannerOpen(!saved);

        return () => {
            clearTimeout(toastTimer.current);
            document.body.style.overflow = "";
        };
    }, []);

    // Display toast notification
    const showToast = (message) => {
        setToast(message);

        clearTimeout(toastTimer.current);

        toastTimer.current = setTimeout(() => {
            setToast("");
        }, 3000);
    };

    // Save cookie preferences
    const saveConsent = ({
        analyticsAllowed,
        marketingAllowed,
        choice,
    }) => {
        const next = {
            essential: true,
            analytics: Boolean(analyticsAllowed),
            marketing: Boolean(marketingAllowed),
            choice,
            updatedAt: new Date().toISOString(),
            version: 1,
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
            console.error("Could not save cookie preferences:", error);
            showToast("Could not save preferences in this browser.");
            return;
        }

        setConsent(next);
        setBannerOpen(false);
        setModalOpen(false);

        document.body.style.overflow = "";
        previousFocus.current?.focus?.();

        showToast(
            choice === "accepted-all"
                ? "All cookie categories accepted."
                : choice === "rejected-optional"
                    ? "Optional cookies rejected."
                    : "Your cookie preferences have been saved."
        );
    };

    // Open cookie preferences
    const openPreferences = () => {
        const saved = readConsent();

        setAnalytics(Boolean(saved?.analytics));
        setMarketing(Boolean(saved?.marketing));

        previousFocus.current = document.activeElement;

        setModalOpen(true);
        document.body.style.overflow = "hidden";
    };

    // Close cookie preferences
    const closePreferences = () => {
        setModalOpen(false);
        document.body.style.overflow = "";

        previousFocus.current?.focus?.();
    };

    // Allow the website footer to reopen cookie settings
    useEffect(() => {
        const handleOpenCookieSettings = () => {
            openPreferences();
        };

        window.addEventListener(
            "open-cookie-settings",
            handleOpenCookieSettings
        );

        return () => {
            window.removeEventListener(
                "open-cookie-settings",
                handleOpenCookieSettings
            );
        };
    }, []);

    return (
        <>
            {/* Cookie Consent Popup */}
            {bannerOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-md">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cookie-title"
                        className="w-full max-w-[520px] rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl sm:p-8"
                    >
                        {/* Header */}
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                                🍪
                            </div>

                            <div>
                                <h2
                                    id="cookie-title"
                                    className="text-xl font-bold"
                                >
                                    Your Privacy Matters
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Manage your cookie preferences
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="mb-6 text-sm leading-6 text-gray-600">
                            We use essential cookies to keep Vyapix working
                            properly. With your permission, we may also use
                            optional analytics and marketing cookies. You can
                            change your preferences at any time.
                        </p>

                        {/* Essential Cookies */}
                        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold">
                                    Essential Cookies
                                </span>

                                <span className="whitespace-nowrap text-xs font-bold text-green-700">
                                    Always Active
                                </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-gray-500">
                                Required for basic functionality, security,
                                and saving your cookie preferences.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    saveConsent({
                                        analyticsAllowed: false,
                                        marketingAllowed: false,
                                        choice: "rejected-optional",
                                    })
                                }
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
                            >
                                Reject All
                            </button>

                            <button
                                type="button"
                                onClick={openPreferences}
                                className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
                            >
                                Manage Preferences
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    saveConsent({
                                        analyticsAllowed: true,
                                        marketingAllowed: true,
                                        choice: "accepted-all",
                                    })
                                }
                                className="w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-700"
                            >
                                Accept All
                            </button>
                        </div>

                        <p className="mt-5 text-center text-xs leading-5 text-gray-400">
                            You can update your preferences anytime through
                            Cookie Settings.
                        </p>
                    </section>
                </div>
            )}

            {/* Cookie Preferences Modal */}
            {modalOpen && (
                <div
                    role="presentation"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            closePreferences();
                        }
                    }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 p-4 backdrop-blur-md"
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        className="max-h-[min(88vh,760px)] w-full max-w-[560px] overflow-auto rounded-[22px] border border-gray-200 bg-white text-gray-900 shadow-2xl"
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 pb-4 pt-6">
                            <div>
                                <h2
                                    id="modal-title"
                                    className="mb-2 text-[23px] font-bold tracking-tight"
                                >
                                    Cookie Preferences
                                </h2>

                                <p className="text-[13px] leading-relaxed text-gray-500">
                                    Choose which optional cookies you are happy
                                    to allow. Essential cookies are always
                                    active because the site needs them to
                                    function.
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close preferences"
                                onClick={closePreferences}
                                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl transition hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
                            >
                                ×
                            </button>
                        </div>

                        {/* Essential Cookies */}
                        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
                            <div>
                                <h3 className="mb-1 text-sm font-bold">
                                    Essential Cookies
                                </h3>

                                <p className="max-w-[370px] text-xs leading-5 text-gray-500">
                                    Needed for core site features, security,
                                    and remembering your consent choice.
                                </p>
                            </div>

                            <span className="whitespace-nowrap text-xs font-extrabold text-green-700">
                                Always On
                            </span>
                        </div>

                        {/* Optional Cookie Categories */}
                        {[
                            {
                                id: "analytics",
                                title: "Analytics Cookies",
                                copy: "Help understand which pages are useful and how visitors use the site. No analytics service is connected yet.",
                                checked: analytics,
                                onChange: setAnalytics,
                            },
                            {
                                id: "marketing",
                                title: "Marketing Cookies",
                                copy: "May be used to measure campaigns or personalize advertising. No marketing tracker is connected yet.",
                                checked: marketing,
                                onChange: setMarketing,
                            },
                        ].map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4"
                            >
                                <div>
                                    <h3 className="mb-1 text-sm font-bold">
                                        {item.title}
                                    </h3>

                                    <p className="max-w-[370px] text-xs leading-5 text-gray-500">
                                        {item.copy}
                                    </p>
                                </div>

                                <label className="relative h-[25px] w-11 shrink-0">
                                    <input
                                        type="checkbox"
                                        aria-label={`Allow ${item.title.toLowerCase()}`}
                                        checked={item.checked}
                                        onChange={(event) =>
                                            item.onChange(
                                                event.target.checked
                                            )
                                        }
                                        className="peer sr-only"
                                    />

                                    <span className="absolute inset-0 cursor-pointer rounded-full bg-gray-300 transition-colors peer-checked:bg-orange-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-orange-500 peer-focus-visible:outline-offset-2 after:absolute after:left-[3px] after:top-[3px] after:h-[19px] after:w-[19px] after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-[19px]" />
                                </label>
                            </div>
                        ))}

                        {/* Modal Footer Buttons */}
                        <div className="flex flex-wrap justify-between gap-3 px-6 pb-6 pt-4">
                            <button
                                type="button"
                                onClick={() =>
                                    saveConsent({
                                        analyticsAllowed: false,
                                        marketingAllowed: false,
                                        choice: "rejected-optional",
                                    })
                                }
                                className="rounded-xl border border-gray-200 bg-orange-50 px-4 py-3 text-[13px] font-bold transition hover:bg-orange-100"
                            >
                                Reject Optional
                            </button>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={closePreferences}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-bold transition hover:bg-gray-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        saveConsent({
                                            analyticsAllowed: analytics,
                                            marketingAllowed: marketing,
                                            choice: "custom",
                                        })
                                    }
                                    className="rounded-xl bg-orange-500 px-4 py-3 text-[13px] font-bold text-white transition hover:bg-orange-600"
                                >
                                    Save My Choices
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Toast Notification */}
            <div
                role="status"
                aria-live="polite"
                className={`pointer-events-none fixed bottom-5 left-1/2 z-[10001] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-3 text-center text-[13px] text-white shadow-xl transition-all duration-300 ${
                    toast
                        ? "translate-y-0 opacity-100"
                        : "translate-y-5 opacity-0"
                }`}
            >
                {toast}
            </div>
        </>
    );
}