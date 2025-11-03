function authorize(...allowedRoles) {
	return (req, res, next) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (!allowedRoles.length) return next();
		if (allowedRoles.includes(req.user.role)) return next();
		return res.status(403).json({ message: 'Forbidden' });
	};
}

module.exports = { authorize };
