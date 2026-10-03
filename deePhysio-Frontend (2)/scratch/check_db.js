const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const messages = await prisma.$queryRaw`SELECT id, body, is_starred FROM communication_messages LIMIT 10`;
    console.log('Messages in DB:', JSON.stringify(messages, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    , 2));
    
    const threads = await prisma.$queryRaw`SELECT * FROM communication_threads LIMIT 5`;
    console.log('Threads in DB:', JSON.stringify(threads, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    , 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
