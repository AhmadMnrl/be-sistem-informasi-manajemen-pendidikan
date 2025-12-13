/**
 * Validasi dan normalize parameter pagination
 */
function getPaginationParams(page = 1, pageSize = 5) {
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.max(1, Math.min(Number(pageSize) || 5, 100));
    return { page: p, pageSize: ps };
}

/**
 * Hitung offset untuk query database
 */
function getOffset(page, pageSize) {
    return (page - 1) * pageSize;
}

/**
 * Build response pagination
 */
function buildPaginationResponse(data, totalItems, page, pageSize) {
    const totalPages = Math.ceil(totalItems / pageSize);
    return {
        data,
        pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}

/**
 * Helper untuk list dengan pagination
 */
async function paginate(options) {
    const { countFn, queryFn, page = 1, pageSize = 5 } = options;
    
    const { page: p, pageSize: ps } = getPaginationParams(page, pageSize);
    const offset = getOffset(p, ps);
    
    const [totalItems, data] = await Promise.all([
        countFn(),
        queryFn(offset, ps),
    ]);

    return buildPaginationResponse(data, totalItems, p, ps);
}

module.exports = {
    getPaginationParams,
    getOffset,
    buildPaginationResponse,
    paginate,
};