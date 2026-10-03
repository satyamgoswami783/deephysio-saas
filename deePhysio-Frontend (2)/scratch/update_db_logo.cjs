const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function updateLogo() {
  try {
    const logoPath = 'd:\\Desktop\\deephysio\\frontend\\public\\logo.png';
    if (!fs.existsSync(logoPath)) {
      console.error('Logo file not found at:', logoPath);
      return;
    }

    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;

    const s = await prisma.globalSettings.findUnique({ where: { key: 'clinicProfile' } });
    if (s) {
      let val = JSON.parse(s.value);
      val.logoDataUrl = base64Logo;
      await prisma.globalSettings.update({
        where: { key: 'clinicProfile' },
        data: { value: JSON.stringify(val) }
      });
      console.log('Logo updated in settings database successfully.');
    } else {
      console.log('Clinic profile settings not found.');
    }
  } catch (e) {
    console.error('Error updating logo:', e);
  } finally {
    await prisma.$disconnect();
  }
}

updateLogo();
