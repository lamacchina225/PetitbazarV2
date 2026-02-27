import { PrismaClient, ProductStatus, SourcePlatform, UserRole } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcryptjs.hash('d2m/Pixel2026!', 10);
  const gestionnairePassword = await bcryptjs.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@petitbazar.ci' },
    update: {
      firstName: 'Admin',
      lastName: 'PetitBazar',
      role: UserRole.ADMIN,
      password: adminPassword,
      city: 'Abidjan',
      commune: 'Plateau',
      phone: '+2250123456789',
    },
    create: {
      email: 'admin@petitbazar.ci',
      phone: '+2250123456789',
      firstName: 'Admin',
      lastName: 'PetitBazar',
      password: adminPassword,
      role: UserRole.ADMIN,
      city: 'Abidjan',
      commune: 'Plateau',
    },
  });

  await prisma.user.upsert({
    where: { email: 'gestionnaire@petitbazar.ci' },
    update: {
      role: UserRole.GESTIONNAIRE,
      password: gestionnairePassword,
      city: 'Abidjan',
      commune: 'Cocody',
      phone: '+2250700000001',
    },
    create: {
      email: 'gestionnaire@petitbazar.ci',
      phone: '+2250700000001',
      firstName: 'Gestion',
      lastName: 'Abidjan',
      password: gestionnairePassword,
      role: UserRole.GESTIONNAIRE,
      city: 'Abidjan',
      commune: 'Cocody',
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'mode' },
      update: { name: 'Mode', featured: true },
      create: { name: 'Mode', slug: 'mode', featured: true },
    }),
    prisma.category.upsert({
      where: { slug: 'electronique' },
      update: { name: 'Electronique', featured: true },
      create: { name: 'Electronique', slug: 'electronique', featured: true },
    }),
    prisma.category.upsert({
      where: { slug: 'accessoires' },
      update: { name: 'Accessoires', featured: true },
      create: { name: 'Accessoires', slug: 'accessoires', featured: true },
    }),
    prisma.category.upsert({
      where: { slug: 'beaute' },
      update: { name: 'Beaute', featured: true },
      create: { name: 'Beaute', slug: 'beaute', featured: true },
    }),
  ]);

  await prisma.product.upsert({
    where: { sku: 'TSHIRT-001' },
    update: {
      name: 'T-shirt Premium',
      slug: 'tshirt-premium',
      description: 'T-shirt coton premium',
      originalPrice: 15000,
      salePrice: 9000,
      cost: 4500,
      discount: 40,
      sourcePlatform: SourcePlatform.ALIEXPRESS,
      sourceUrl: 'https://www.aliexpress.com/item/1005000000001.html',
      sourceProductId: '1005000000001',
      categoryId: categories[0].id,
      stock: 50,
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
    },
    create: {
      name: 'T-shirt Premium',
      slug: 'tshirt-premium',
      description: 'T-shirt coton premium',
      originalPrice: 15000,
      salePrice: 9000,
      cost: 4500,
      discount: 40,
      sku: 'TSHIRT-001',
      sourcePlatform: SourcePlatform.ALIEXPRESS,
      sourceUrl: 'https://www.aliexpress.com/item/1005000000001.html',
      sourceProductId: '1005000000001',
      categoryId: categories[0].id,
      stock: 50,
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
    },
  });

  await prisma.product.upsert({
    where: { sku: 'EARBUDS-001' },
    update: {
      name: 'Ecouteurs Bluetooth',
      slug: 'ecouteurs-bluetooth',
      description: 'Ecouteurs sans fil 20h autonomie',
      originalPrice: 35000,
      salePrice: 20000,
      cost: 10000,
      discount: 43,
      sourcePlatform: SourcePlatform.SHEIN,
      sourceUrl: 'https://www.shein.com/product/2000001.html',
      sourceProductId: '2000001',
      categoryId: categories[1].id,
      stock: 30,
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'],
    },
    create: {
      name: 'Ecouteurs Bluetooth',
      slug: 'ecouteurs-bluetooth',
      description: 'Ecouteurs sans fil 20h autonomie',
      originalPrice: 35000,
      salePrice: 20000,
      cost: 10000,
      discount: 43,
      sku: 'EARBUDS-001',
      sourcePlatform: SourcePlatform.SHEIN,
      sourceUrl: 'https://www.shein.com/product/2000001.html',
      sourceProductId: '2000001',
      categoryId: categories[1].id,
      stock: 30,
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'],
    },
  });

  await prisma.product.upsert({
    where: { sku: 'MIRROR-001' },
    update: {
      name: 'Miroir LED Salle de Bain',
      slug: 'miroir-led-salle-de-bain',
      description: 'Miroir avec eclairage LED 40cm',
      originalPrice: 25000,
      salePrice: 15000,
      cost: 7500,
      discount: 40,
      sourcePlatform: SourcePlatform.TAOBAO,
      sourceUrl: 'https://world.taobao.com/item/3000001.htm',
      sourceProductId: '3000001',
      categoryId: categories[2].id,
      stock: 20,
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800'],
    },
    create: {
      name: 'Miroir LED Salle de Bain',
      slug: 'miroir-led-salle-de-bain',
      description: 'Miroir avec eclairage LED 40cm',
      originalPrice: 25000,
      salePrice: 15000,
      cost: 7500,
      discount: 40,
      sku: 'MIRROR-001',
      sourcePlatform: SourcePlatform.TAOBAO,
      sourceUrl: 'https://world.taobao.com/item/3000001.htm',
      sourceProductId: '3000001',
      categoryId: categories[2].id,
      stock: 20,
      status: ProductStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800'],
    },
  });

  console.log('Seed completed. Admin:', admin.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
