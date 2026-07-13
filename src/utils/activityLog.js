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
	}
}

module.exports = { logActivity };
