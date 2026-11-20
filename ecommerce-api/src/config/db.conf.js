import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri && process.env.NODE_ENV === "production") {
    console.error("Error fatal: Falta la variable de entorno MONGODB_URI en produccion.");
    process.exit(1);
  }

  const mongoURI = uri || "mongodb://localhost:27017/ecommerce-db-test";

  try {
    const connection = await mongoose.connect(mongoURI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
