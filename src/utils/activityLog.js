const { prisma } = require('../prisma');

async function logActivity({ userId, action, entity, entityId, metadata }) {
	try {
		await prisma.activityLog.create({
			data: {
				userId,
				action,
				entity: entity || null,
				entityId: entityId || null,
				metadata: metadata || undefined,
			},
		});
	} catch (e) {
		// intentionally ignore errors to not block main flow
	}
}

module.exports = { logActivity };
