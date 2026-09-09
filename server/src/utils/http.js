export class AppError extends Error { constructor(status, message, details) { super(message); this.status=status; this.details=details; } }
export const asyncHandler = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
export const pageMeta = (page,limit,total) => ({page,limit,total,pages:Math.ceil(total/limit)});
