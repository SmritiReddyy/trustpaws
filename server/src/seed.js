require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('admin123', 10);
  const staffPass = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@huft.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@huft.com', password: adminPass, role: 'ADMIN' },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'groomer@huft.com' },
    update: {},
    create: { name: 'Priya Sharma', email: 'groomer@huft.com', password: staffPass, role: 'STAFF' },
  });

  const parent = await prisma.parent.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: { name: 'Rahul Verma', phone: '9999999999', email: 'rahul@example.com' },
  });

  const pet = await prisma.pet.create({
    data: {
      name: 'Bruno',
      breed: 'Labrador',
      species: 'Dog',
      age: 3,
      weight: 28.5,
      parentId: parent.id,
    },
  });

  await prisma.appointment.create({
    data: {
      petId: pet.id,
      staffId: staff.id,
      scheduledAt: new Date(),
      status: 'CHECKED_IN',
      notes: 'Regular monthly grooming',
      services: {
        create: [
          { name: 'Bath & Blow Dry' },
          { name: 'Haircut & Styling' },
          { name: 'Nail Trimming' },
          { name: 'Ear Cleaning' },
          { name: 'Teeth Brushing' },
        ],
      },
    },
  });

  console.log('Seed complete');
  console.log('Admin: admin@huft.com / admin123');
  console.log('Staff: groomer@huft.com / staff123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
