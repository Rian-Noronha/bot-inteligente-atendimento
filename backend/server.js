require('dotenv').config();
const app = require('./src/app');

const PORT = parseInt(process.env.PORT || '3000');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application -> http://localhost:${PORT}`);
});