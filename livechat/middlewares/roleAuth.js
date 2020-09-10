function hasPermission(permission) {
  return (req, res, next) => {
    if (req.payload.permissions.includes(permission)) {
      next();
    } else res.status(401).json({ message: 'You do not have permission to access this API' });
  };
}

module.exports = hasPermission;
