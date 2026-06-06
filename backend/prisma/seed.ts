import { PrismaClient } from '@prisma/client';
import { Role, RFQStatus, QuotationStatus, POStatus, InvoiceStatus } from '../src/types/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with enterprise-grade demo records...');

  // Clear existing records
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.vendorInvitation.deleteMany({});
  await prisma.rfqItem.deleteMany({});
  await prisma.rfq.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.vendorCategory.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [];
  
  // 1 Admin
  users.push(await prisma.user.create({
    data: {
      email: 'admin@vendorbridge.com',
      password: passwordHash,
      firstName: 'Vikram',
      lastName: 'Sharma',
      role: Role.ADMIN,
      phone: '+919876543210',
      country: 'India',
      additionalInfo: 'System Administrator',
      status: 'ACTIVE',
    }
  }));

  // 3 Procurement Officers
  for (let i = 1; i <= 3; i++) {
    users.push(await prisma.user.create({
      data: {
        email: `officer${i}@vendorbridge.com`,
        password: passwordHash,
        firstName: ['Amit', 'Rajesh', 'Priya'][i-1],
        lastName: ['Patel', 'Kumar', 'Singh'][i-1],
        role: Role.PROCUREMENT_OFFICER,
        phone: `+91987654321${i}`,
        country: 'India',
        additionalInfo: `Senior Procurement Specialist - Team ${i}`,
        status: 'ACTIVE',
      }
    }));
  }

  // 2 Managers / Approvers
  for (let i = 1; i <= 2; i++) {
    users.push(await prisma.user.create({
      data: {
        email: `manager${i}@vendorbridge.com`,
        password: passwordHash,
        firstName: ['Sanjay', 'Meera'][i-1],
        lastName: ['Mehta', 'Iyer'][i-1],
        role: Role.MANAGER,
        phone: `+91987654322${i}`,
        country: 'India',
        additionalInfo: `Regional Procurement Director`,
        status: 'ACTIVE',
      }
    }));
  }

  // 4 Vendor Users (will be linked to vendors)
  for (let i = 1; i <= 4; i++) {
    users.push(await prisma.user.create({
      data: {
        email: `vendor${i}@vendorbridge.com`,
        password: passwordHash,
        firstName: ['Rahul', 'Anil', 'Siddharth', 'Nisha'][i-1],
        lastName: ['Gupta', 'Verma', 'Joshi', 'Reddy'][i-1],
        role: Role.VENDOR,
        phone: `+91987654323${i}`,
        country: 'India',
        additionalInfo: `Account Manager`,
        status: 'ACTIVE',
      }
    }));
  }

  console.log(`Created ${users.length} users successfully.`);

  // 2. Create Vendor Categories
  const categories: any[] = [];
  const categoryNames = ['Office Supplies', 'IT Equipment', 'Logistics', 'Construction', 'Marketing'];
  
  for (const name of categoryNames) {
    categories.push(await prisma.vendorCategory.create({
      data: {
        name,
        description: `Vendor list for procurement of ${name} services and products`,
      }
    }));
  }

  console.log(`Created ${categories.length} categories.`);

  // 3. Create 20 Vendors
  const vendors = [];
  const vendorNames = [
    'Infra Supplies Pvt Ltd', 'TechCare LTD', 'Fastlog Transport', 'OfficeNeed Co', 'SecureIT Systems',
    'ElectroCorp', 'Alpha Build', 'Global Trade', 'Pioneer Logistics', 'Vertex Computers',
    'Staples Office', 'Skyline Infra', 'Mega Circuits', 'Prism Designs', 'Apex Logistics',
    'Zenith Electronics', 'Green Solutions', 'Sterling Fab', 'Omega IT Services', 'Matrix Corp'
  ];

  for (let i = 1; i <= 20; i++) {
    const catIndex = (i - 1) % categories.length;
    const isLinkedToUser = i <= 4; // Link first 4 vendors to vendor1-4 users
    
    vendors.push(await prisma.vendor.create({
      data: {
        companyName: vendorNames[i-1],
        categoryId: categories[catIndex].id,
        gstNumber: `27AAAAA${String(1000 + i)}A1Z${i % 9}`,
        panNumber: `AAAAA${String(1000 + i)}A`,
        address: `${100 + i}, Industrial Suburb, Phase ${i % 3 + 1}`,
        city: ['Mumbai', 'Bangalore', 'Delhi', 'Pune'][i % 4],
        state: ['Maharashtra', 'Karnataka', 'Delhi', 'Maharashtra'][i % 4],
        country: 'India',
        pincode: `4000${String(10 + i)}`,
        contactPerson: ['Rahul Gupta', 'Anil Verma', 'Siddharth Joshi', 'Nisha Reddy', 'Karan Johar', 'Sunita Rao'][i % 6],
        email: isLinkedToUser ? `vendor${i}@vendorbridge.com` : `info@vendor${i}bridge.com`,
        mobile: `+9199887766${String(10 + i)}`,
        website: `https://vendor${i}bridge.com`,
        rating: Number((4.0 + (i % 11) * 0.1).toFixed(1)),
        status: 'ACTIVE',
        userId: isLinkedToUser ? users.find(u => u.email === `vendor${i}@vendorbridge.com`)?.id : null,
      }
    }));
  }

  console.log(`Created ${vendors.length} vendors.`);

  // 4. Create 25 RFQs
  const rfqs = [];
  const rfqTitles = [
    'Ergonomic Chairs and Desks', 'Laptops for Dev Team', 'AC Maintenance Contract', 'Office Renovation Materials', 'Brochures and Flyers Printing',
    'Server Racks Procurement', 'Warehouse Forklift', 'Stationery Refill Q3', 'Cloud Firewall License', 'Cabling and Networking Solutions',
    'Conference Room Projectors', 'Employee Transport Services', 'Breakroom Coffee Machines', 'Exhibition Booth Fabrication', 'Security Guard Uniforms',
    'LED Light Fittings', 'Storage Filing Cabinets', 'Pantry Dry Provisions', 'UPS Batteries Replacement', 'Packaging Cartons Supply',
    'Web Hosting Server License', 'Enterprise Email Suite Subscription', 'Corporate Gift Hampers', 'Industrial Safety Helmets', 'Pest Control Services'
  ];

  for (let i = 1; i <= 25; i++) {
    const catIndex = (i - 1) % categories.length;
    const officerIndex = (i - 1) % 3 + 1; // officer1, officer2, officer3
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (i * 2) + 5);

    const rfqNumber = `RFQ-2026-${String(i).padStart(4, '0')}`;

    // Select 3 random vendors from the same category to invite
    const categoryVendors = vendors.filter(v => v.categoryId === categories[catIndex].id);
    const invitedVendors = categoryVendors.slice(0, 3);

    rfqs.push(await prisma.rfq.create({
      data: {
        rfqNumber,
        title: rfqTitles[i-1],
        description: `Bids are invited for procurement of ${rfqTitles[i-1]} for Bangalore corporate office operations.`,
        categoryId: categories[catIndex].id,
        deadline,
        budget: 50000 + (i * 15000),
        status: i <= 5 ? RFQStatus.DRAFT : i <= 15 ? RFQStatus.OPEN : i <= 20 ? RFQStatus.CLOSED : RFQStatus.AWARDED,
        createdById: users.find(u => u.email === `officer${officerIndex}@vendorbridge.com`)!.id,
        items: {
          create: [
            { itemName: `${rfqTitles[i-1]} Pack A`, quantity: 10 + i, unit: 'NOS' },
            { itemName: `${rfqTitles[i-1]} Pack B`, quantity: 5 + i, unit: 'NOS' }
          ]
        },
        invitations: {
          create: invitedVendors.map(v => ({
            vendorId: v.id,
            status: 'PENDING',
          }))
        }
      },
      include: {
        items: true,
        invitations: true
      }
    }));
  }

  console.log(`Created ${rfqs.length} RFQs.`);

  // 5. Create 50 Quotations
  const quotations = [];
  let quotationIndex = 1;

  for (const rfq of rfqs) {
    // Only generate quotations for RFQs that are OPEN, CLOSED, or AWARDED
    if (rfq.status === RFQStatus.DRAFT) continue;

    for (const invite of rfq.invitations) {
      const vendor = vendors.find(v => v.id === invite.vendorId)!;
      const subtotal = 30000 + (rfq.id * 10000) - (vendor.id * 500);
      const taxRate = 18.0;
      const taxAmount = subtotal * (taxRate / 100);
      const grandTotal = subtotal + taxAmount;

      const quotationNumber = `QTN-2026-${String(quotationIndex++).padStart(4, '0')}`;

      // Mark status as ACCEPTED for awarded RFQ quotations, else SUBMITTED
      let qtnStatus = QuotationStatus.SUBMITTED;
      if (rfq.status === RFQStatus.AWARDED && invite.vendorId === rfq.invitations[0].vendorId) {
        qtnStatus = QuotationStatus.ACCEPTED;
      } else if (rfq.status === RFQStatus.AWARDED) {
        qtnStatus = QuotationStatus.REJECTED;
      }

      quotations.push(await prisma.quotation.create({
        data: {
          quotationNumber,
          rfqId: rfq.id,
          vendorId: vendor.id,
          deliveryTimeline: 7 + (vendor.id % 5),
          taxRate,
          taxAmount,
          subtotal,
          grandTotal,
          notes: `Commercial quote submitted by ${vendor.companyName}. Valid for 60 days.`,
          status: qtnStatus,
          items: {
            create: rfq.items.map((item: any) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: subtotal / (rfq.items.length * item.quantity),
              totalPrice: subtotal / rfq.items.length,
            }))
          }
        },
        include: {
          items: true
        }
      }));
    }
  }

  console.log(`Created ${quotations.length} Quotations.`);

  // 6. Create 10 Purchase Orders
  const acceptedQuotations = quotations.filter(q => q.status === QuotationStatus.ACCEPTED).slice(0, 10);
  const purchaseOrders = [];

  for (let i = 0; i < acceptedQuotations.length; i++) {
    const qtn = acceptedQuotations[i];
    const poNumber = `PO-2026-${String(i+1).padStart(4, '0')}`;

    purchaseOrders.push(await prisma.purchaseOrder.create({
      data: {
        poNumber,
        quotationId: qtn.id,
        vendorId: qtn.vendorId,
        subtotal: qtn.subtotal,
        taxAmount: qtn.taxAmount,
        grandTotal: qtn.grandTotal,
        status: i < 3 ? POStatus.GENERATED : i < 6 ? POStatus.SENT : i < 8 ? POStatus.ACCEPTED : POStatus.COMPLETED,
        items: {
          create: qtn.items.map(item => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: qtn.taxRate,
            totalPrice: item.totalPrice,
          }))
        }
      }
    }));
  }

  console.log(`Created ${purchaseOrders.length} Purchase Orders.`);

  // 7. Create 10 Invoices
  const completedPOs = purchaseOrders.filter(po => po.status === POStatus.COMPLETED || po.status === POStatus.ACCEPTED).slice(0, 10);
  const invoices = [];

  for (let i = 0; i < completedPOs.length; i++) {
    const po = completedPOs[i];
    const invoiceNumber = `INV-2026-${String(i+1).padStart(4, '0')}`;

    invoices.push(await prisma.invoice.create({
      data: {
        invoiceNumber,
        poId: po.id,
        vendorId: po.vendorId,
        subtotal: po.subtotal,
        taxAmount: po.taxAmount,
        grandTotal: po.grandTotal,
        status: i < 3 ? InvoiceStatus.DRAFT : i < 6 ? InvoiceStatus.SENT : InvoiceStatus.PAID,
      }
    }));
  }

  console.log(`Created ${invoices.length} Invoices.`);

  // Create notifications and activity logs for audit logs
  await prisma.activityLog.create({
    data: {
      userId: users[0].id,
      action: 'SYSTEM_SEED',
      module: 'SYSTEM',
      description: 'System seed completed. 10 Users, 5 Categories, 20 Vendors, 25 RFQs seeded.',
    }
  });

  console.log('Database seeded successfully.');
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
