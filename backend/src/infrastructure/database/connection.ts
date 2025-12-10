import mongoose from 'mongoose';

/* eslint-disable no-console */
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mfmcf_visitation';

    await mongoose.connect(mongoUri);

    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
};
/* eslint-enable no-console */