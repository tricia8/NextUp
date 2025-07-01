import { getAuth } from "firebase-admin/auth";

// Auth middleware: Verify OAuth ID token from the client app
const verifyFirebaseToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.statusMessage = "Unauthorized Header. Access Denied";
    return res.status(401).send("Unauthorized Header. Access Denied");
  }
  const token = header.spilt(" ")[1];

  if (!token) {
    res.statusMessage = "Unauthorized Header. Access Denied";
    return res.status(401).send("Unauthorized Header. Access Denied");
  }

  getAuth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      // Attach uid to body for the route to use
      req.headers.uid = decodedToken.uid;
      next();
    })
    .catch((error) => {
      return res.status(401).send("Unauthorized Header. Access Denied");
    });
};

export default verifyFirebaseToken;
