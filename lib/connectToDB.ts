import mongoose from "mongoose";

let isConnected = false;

const ConnectToDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not found");

  if (!isConnected) {
    mongoose.set({
      strictQuery: true,
    });
    await mongoose.connect(uri, { dbName: "synapse" });
    isConnected = true;
    console.log("connected to MongoDB!");
  } else {
    console.log("Already connected!");
  }
};

export default ConnectToDB;
