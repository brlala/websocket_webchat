function hasRole(role) {
  return (req, res, next) => {
    if (req.payload.permissions.includes(role)) {
      next();
    } else res.status(401).json({ message: 'You do not have permission to access this API' });
  };
}

module.exports = hasRole;
