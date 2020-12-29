module.exports = analyticList => {
  const list = {};
  analyticList.forEach(analytic => {
    list[analytic.id] = {
      id: analytic.id,
      name: analytic.name,
      description: analytic.description
    };
  });
  return list;
};
