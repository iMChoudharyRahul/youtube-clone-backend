//Syntex-01 using Promise
//More Learn about Check Nodejs Api error doces
// https://nodejs.org/api/errors.html

const asyncHandler = requestHandlerFun => {
  return (req, res, next) => {
    Promise.resolve(requestHandlerFun(req, res, next)).catch(error => {
      next(error);
    });
  };
};

export { asyncHandler };

// Syntex-02
// const asyncHandler = (asyncFun) => async (req, res, next) => {
//  try {
//  await asyncFun(req, res, next)
//  } catch (error) {
//     res.status(err.code || 500).json({
//         success: false,
//    message: error.message
//     })
//  }
// }
