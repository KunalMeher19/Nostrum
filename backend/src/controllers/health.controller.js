const getHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'nostrum-backend',
    uptime: process.uptime(),
  });
};

module.exports = { getHealth };
