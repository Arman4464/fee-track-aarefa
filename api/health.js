
export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    message: "AarefaTution API is running",
    timestamp: new Date().toISOString()
  });
}
