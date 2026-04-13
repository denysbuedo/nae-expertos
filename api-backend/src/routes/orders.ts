import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        activities: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Get order by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        activities: {
          include: {
            subactivities: {
              include: {
                deliverables: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order' });
  }
});

// Create order
router.post('/', async (req: Request, res: Response) => {
  try {
    const { number, title, description, status, startDate, endDate } = req.body;

    const order = await prisma.order.create({
      data: {
        number,
        title,
        description,
        status,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error creating order' });
  }
});

// Update order
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { number, title, description, status, startDate, endDate } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        number,
        title,
        description,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error updating order' });
  }
});

// Delete order
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.order.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting order' });
  }
});

export default router;
