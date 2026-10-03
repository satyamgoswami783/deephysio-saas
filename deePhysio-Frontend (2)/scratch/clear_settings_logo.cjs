const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const s = await prisma.globalSettings.findUnique({ where: { key: 'clinicProfile' } });
    if (s) {
      let val;
      try {
        val = JSON.parse(s.value);
      } catch (e) {
        // If it's not JSON, it might be the old format, but usually it's JSON now
        console.error('Settings value is not valid JSON');
        return;
      }
      
      val.logoDataUrl = '';
      await prisma.globalSettings.update({
        where: { key: 'clinicProfile' },
        data: { value: JSON.stringify(val) }
      });
      console.log('Logo cleared from settings database successfully.');
    } else {
      console.log('Clinic profile settings not found.');
    }
  } catch (e) {
    console.error('Error fixing settings:', e);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
