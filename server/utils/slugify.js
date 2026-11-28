export const slugify = (value = "") => {
    const base = String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return base || "item";
};

/**
 * Generates a unique readable slug (e.g. "amul", "amul-2") within the given
 * scope filter without appending MongoDB ObjectIds.
 */
export const generateUniqueSlug = async (
    Model,
    rawName,
    scopeFilter = {},
    excludeId = null
) => {
    const base = slugify(rawName);
    const query = { ...scopeFilter };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const existing = await Model.find({
        ...query,
        slug: { $regex: `^${base}(-\\d+)?$` },
    })
        .select("slug")
        .lean();

    const used = new Set(existing.map((doc) => doc.slug).filter(Boolean));

    if (!used.has(base)) {
        return base;
    }

    let counter = 2;
    while (used.has(`${base}-${counter}`)) {
        counter += 1;
    }

    return `${base}-${counter}`;
};

/**
 * Ensures every returned document has a deterministic unique `slug` field
 * even for legacy records created before `slug` was persisted.
 */
export const attachDeterministicSlugs = (docs = []) => {
    const ordered = [...docs].sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (tA !== tB) return tA - tB;
        return String(a._id).localeCompare(String(b._id));
    });

    const used = new Set();
    const slugMap = new Map();

    for (const doc of ordered) {
        const base = doc.slug || slugify(doc.name || doc.brandName || "item");
        let candidate = base;
        let counter = 2;

        while (used.has(candidate)) {
            candidate = `${base}-${counter}`;
            counter += 1;
        }

        used.add(candidate);
        slugMap.set(String(doc._id), candidate);
    }

    return docs.map((doc) => {
        const obj = doc.toObject ? doc.toObject() : { ...doc };
        obj.slug = slugMap.get(String(obj._id)) || obj.slug || slugify(obj.name);
        return obj;
    });
};
