// Single shared flag so every model file can check "are we on the mock DB?"
// db.js flips this to true if MongoDB isn't reachable. Every model (User,
// Admin, Project, Message, Booking) reads the SAME object, so they all agree.
const mockState = {
  useMock: false
};

module.exports = mockState;
