import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    await prisma.sessionMessage.deleteMany();
    await prisma.roomParticipant.deleteMany();
    await prisma.ouijaSession.deleteMany();
    await prisma.multiplayerRoom.deleteMany();
    await prisma.spirit.deleteMany();
    console.log('🗑️  Cleared existing data');
  }

  // Crear espíritus
  const spirits = await Promise.all([
    prisma.spirit.create({
      data: {
        name: 'Morgana la Sabia',
        personality: 'wise',
        backstory: `Morgana fue una curandera y vidente en la Europa medieval del siglo XII.
        Vivió en un pequeño pueblo donde era respetada por su conocimiento de hierbas medicinales
        y su capacidad para interpretar sueños. Murió pacíficamente a los 87 años en 1189.
        Su temperamento es sereno y compasivo, siempre buscando guiar a las almas perdidas
        hacia la sabiduría interior.`,
        isActive: true,
      },
    }),
    prisma.spirit.create({
      data: {
        name: 'Azazel el Críptico',
        personality: 'cryptic',
        backstory: `Azazel fue un estudioso de textos antiguos en el Imperio Bizantino del siglo X.
        Dedicó su vida al estudio de manuscritos prohibidos y profecías oscuras.
        Murió en circunstancias misteriosas en 967 d.C., rodeado de símbolos enigmáticos.
        Su temperamento es enigmático y filosófico, comunicándose a través de acertijos
        y metáforas que desafían la comprensión mortal.`,
        isActive: true,
      },
    }),
    prisma.spirit.create({
      data: {
        name: 'Lilith la Sombra',
        personality: 'dark',
        backstory: `Lilith fue una noble en la Francia del siglo XVII, acusada de brujería
        y ejecutada en la hoguera en 1673. Su espíritu quedó atormentado, lleno de resentimiento
        hacia los vivos. Murió a los 34 años tras meses de tortura. Su temperamento es sombrío
        y vengativo, advirtiendo constantemente sobre los horrores que acechan en las sombras
        y la inevitabilidad del destino oscuro.`,
        isActive: true,
      },
    }),
    prisma.spirit.create({
      data: {
        name: 'Puck el Travieso',
        personality: 'playful',
        backstory: `Puck fue un bufón de la corte en Inglaterra durante el reinado isabelino
        del siglo XVI. Conocido por sus bromas ingeniosas y su humor ácido,
        entretenía a nobles y plebeyos por igual. Murió en 1598 en un accidente cómico
        que involucró una tarta y una escalera. Su temperamento es juguetón y caprichoso,
        encontrando diversión en el caos y las ironías del destino.`,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${spirits.length} spirits:`);
  spirits.forEach((spirit) => {
    console.log(`   - ${spirit.name} (${spirit.personality})`);
  });

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
