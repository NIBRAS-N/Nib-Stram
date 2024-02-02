const  asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}

//Normal function:

// function asyncHandler(requestHandler) {
//     return function(req, res, next) {
//         Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
//     };
// }


// const asyncHandler = (fn) => async (req,res,next) =>{
//     try {
//         await fn(req,res,next);
//     } catch (error) {
//         console.log("error in utils || asyncHandler " , error);
//         res.status(error.code || 500 ).json({
//             success:false,
//             message:error.message
//         })
//     }
// }

// in normal function:

// function asyncHandler(fn) {
//     return async function(req, res, next) {
//       try {
//         await fn(req, res, next);
//       } catch (error) {
//         console.log("error in utils || asyncHandler ", error);
//         res.status(error.code || 500).json({
//           success: false,
//           message: error.message
//         });
//       }
//     };
//   }
  


// How to use the above function:

// app.get('/some/route', asyncHandler(async (req, res, next) => {
//     // Your asynchronous logic here
// }));
  