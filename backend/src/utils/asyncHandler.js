const asyncHandler = (funcation) => {
    return (req, res, next) => {
        Promise.resolve(funcation(req, res, next)).catch(err => next(err))
    }
}
module.exports = asyncHandler