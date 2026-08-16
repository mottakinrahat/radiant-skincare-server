const fs = require('fs');

// 1. src/app/modules/order/order.services.ts
let servicesTs = fs.readFileSync('/app/src/app/modules/order/order.services.ts', 'utf8');

const deleteServiceTs = `
const deleteOrder = async (orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: orderId },
        { orderNumber: isNaN(Number(orderId)) ? -1 : Number(orderId) }
      ]
    },
    include: { items: true },
  });

  if (!order) {
    return { id: orderId, deleted: true, message: "Order not found or already deleted" };
  }

  const realId = order.id;
  const confirmedStatuses = ["CONFIRMED", "PROGRESSING", "SHIPPED", "DELIVERED"];

  if (confirmedStatuses.includes(order.status) && Array.isArray(order.items)) {
    for (const item of order.items) {
      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await (prisma as any).stockMovement?.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: "IN",
            reason: \`Order Deleted: #\${order.orderNumber}\`,
          },
        });
      } catch (e: any) {
        console.warn("Stock restoration note on delete:", e.message);
      }
    }
  }

  try { await (prisma as any).orderItems?.deleteMany({ where: { orderId: realId } }); } catch (e) {}
  try { await (prisma as any).courierShipmentHistory?.deleteMany({ where: { orderId: realId } }); } catch (e) {}
  try { await (prisma as any).payment?.deleteMany({ where: { orderId: realId } }); } catch (e) {}
  await prisma.order.delete({ where: { id: realId } });

  return { id: realId, orderNumber: order.orderNumber, deleted: true };
};
`;

if (!servicesTs.includes('deleteOrder =')) {
  servicesTs = servicesTs.replace(
    'export const OrderServices = {',
    deleteServiceTs + '\nexport const OrderServices = {\n  deleteOrder,'
  );
  fs.writeFileSync('/app/src/app/modules/order/order.services.ts', servicesTs);
  console.log('Successfully updated order.services.ts in src');
} else {
  console.log('order.services.ts already has deleteOrder in src');
}

// 2. src/app/modules/order/order.controller.ts
let controllerTs = fs.readFileSync('/app/src/app/modules/order/order.controller.ts', 'utf8');

const deleteControllerTs = `
const deleteOrder = catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const result = await OrderServices.deleteOrder(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Order deleted successfully",
    data: result,
  });
});
`;

if (!controllerTs.includes('deleteOrder =')) {
  controllerTs = controllerTs.replace(
    'export const OrderController = {',
    deleteControllerTs + '\nexport const OrderController = {\n  deleteOrder,'
  );
  fs.writeFileSync('/app/src/app/modules/order/order.controller.ts', controllerTs);
  console.log('Successfully updated order.controller.ts in src');
} else {
  console.log('order.controller.ts already has deleteOrder in src');
}

// 3. src/app/modules/order/order.routes.ts
let routesTs = fs.readFileSync('/app/src/app/modules/order/order.routes.ts', 'utf8');

if (!routesTs.includes('router.delete("/:id",')) {
  routesTs = routesTs.replace(
    'export const orderRoutes = router;',
    'router.delete("/:id", OrderController.deleteOrder);\n\nexport const orderRoutes = router;'
  );
  fs.writeFileSync('/app/src/app/modules/order/order.routes.ts', routesTs);
  console.log('Successfully updated order.routes.ts in src');
} else {
  console.log('order.routes.ts already has DELETE /:id in src');
}
