import mongoose from 'mongoose';

mongoose.set('bufferCommands',false);

export async function connectDatabase(){
  const connection=await mongoose.connect(process.env.MONGODB_URI,{
    serverSelectionTimeoutMS:10000,
    connectTimeoutMS:10000,
    socketTimeoutMS:20000,
    maxPoolSize:10,
  });
  console.log(`Connected to MongoDB: ${connection.connection.name}`);
  return connection;
}
