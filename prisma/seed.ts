import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean DB in order of relations
  await prisma.auditLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productReference.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Database cleaned.");

  // Create Users
  const adminUser = await prisma.user.create({
    data: {
      id: "mock-admin-uuid",
      email: "admin@bikecommerce.com",
      name: "Admin Bike Shop",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      role: "ADMIN",
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      id: "mock-customer-uuid",
      email: "customer@gmail.com",
      name: "Juan Perez",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      role: "CUSTOMER",
    },
  });

  console.log("👥 Users created.");

  // Create Addresses
  const address = await prisma.address.create({
    data: {
      userId: customerUser.id,
      street: "Av. Corrientes 1234",
      city: "Buenos Aires",
      state: "CABA",
      postalCode: "1043",
      country: "Argentina",
      isDefault: true,
    },
  });

  console.log("📍 Addresses created.");

  // Create Coupons
  const coupon = await prisma.coupon.create({
    data: {
      code: "BIKE20",
      discountType: "PERCENTAGE",
      discountValue: 20,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year from now
      isActive: true,
    },
  });

  console.log("🎟️ Coupons created.");

  // Create Categories
  const catMountain = await prisma.category.create({
    data: { name: "Mountain Bikes", slug: "mountain-bikes", description: "Bicicletas todo terreno para senderos y montaña" },
  });
  const catRoad = await prisma.category.create({
    data: { name: "Road Bikes", slug: "road-bikes", description: "Bicicletas de ruta aerodinámicas y veloces" },
  });
  const catElectric = await prisma.category.create({
    data: { name: "Electric Bikes", slug: "electric-bikes", description: "Bicicletas con asistencia eléctrica integradas" },
  });
  const catAccessories = await prisma.category.create({
    data: { name: "Components & Helmets", slug: "components-helmets", description: "Accesorios, componentes y cascos de protección" },
  });

  console.log("📁 Categories created.");

  // Create Brands
  const brandSpecialized = await prisma.brand.create({
    data: { name: "Specialized", slug: "specialized", imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=150&auto=format&fit=crop" },
  });
  const brandTrek = await prisma.brand.create({
    data: { name: "Trek", slug: "trek", imageUrl: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=150&auto=format&fit=crop" },
  });
  const brandGiant = await prisma.brand.create({
    data: { name: "Giant", slug: "giant", imageUrl: "https://images.unsplash.com/photo-1576435465679-644487042a13?q=80&w=150&auto=format&fit=crop" },
  });

  console.log("🏷️ Brands created.");

  // Create Products
  const productsData = [
    {
      name: "Stumpjumper Alloy 29",
      slug: "stumpjumper-alloy-29",
      description: "El Stumpjumper Alloy trae toda la geometría moderna y la cinemática de suspensión inigualable en un paquete de aluminio altamente resistente. Perfecto para dominar cualquier sendero de montaña.",
      images: [
        "https://images.unsplash.com/photo-1576435465679-644487042a13?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800&auto=format&fit=crop"
      ],
      categoryId: catMountain.id,
      brandId: brandSpecialized.id,
      firebaseKey: "prod_stumpjumper_alloy",
      mercadoLibreId: "MLA876543210",
      sku: "SP-STUMP-29-AL",
    },
    {
      name: "Trek Domane SL 5",
      slug: "trek-domane-sl-5",
      description: "La Domane SL 5 está diseñada para rodar suavemente sobre asfalto rugoso y caminos de gravel ligero. El cuadro de carbono OCLV ligero cuenta con IsoSpeed trasero para amortiguar los baches.",
      images: [
        "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1502744691472-de0b8b2650b8?q=80&w=800&auto=format&fit=crop"
      ],
      categoryId: catRoad.id,
      brandId: brandTrek.id,
      firebaseKey: "prod_trek_domane_sl5",
      mercadoLibreId: "MLA876543211",
      sku: "TR-DOM-SL5-RD",
    },
    {
      name: "Giant Talon 29 1",
      slug: "giant-talon-29-1",
      description: "Siente el ritmo con este nuevo cuadro rígido de aluminio fabricado para aspirantes a ciclistas de montaña. Cuenta con ruedas estables de 29 pulgadas y suspensión delantera SR Suntour.",
      images: [
        "https://images.unsplash.com/photo-1576435465679-644487042a13?q=80&w=800&auto=format&fit=crop"
      ],
      categoryId: catMountain.id,
      brandId: brandGiant.id,
      firebaseKey: "prod_giant_talon_1",
      mercadoLibreId: "MLA876543212",
      sku: "GI-TAL-29-1",
    },
    {
      name: "Specialized Turbo Vado 4.0",
      slug: "specialized-turbo-vado-4-0",
      description: "La Turbo Vado es la bicicleta eléctrica de ciudad definitiva. Es rápida, suave y divertida. Ofrece asistencia de pedal inteligente que multiplica tus esfuerzos por cuatro.",
      images: [
        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop"
      ],
      categoryId: catElectric.id,
      brandId: brandSpecialized.id,
      firebaseKey: "prod_turbo_vado_40",
      mercadoLibreId: "MLA876543213",
      sku: "SP-TURB-VADO-4",
    }
  ];

  for (const item of productsData) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        images: item.images,
        categoryId: item.categoryId,
        brandId: item.brandId,
        isActive: true,
      },
    });

    await prisma.productReference.create({
      data: {
        productId: product.id,
        firebaseKey: item.firebaseKey,
        mercadoLibreId: item.mercadoLibreId,
        sku: item.sku,
      },
    });
  }

  console.log("🚲 Products and ProductReferences seeded.");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
